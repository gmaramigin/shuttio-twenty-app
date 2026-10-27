import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  AppPath,
  enqueueSnackbar,
  navigate,
  openCommandConfirmationModal,
} from 'twenty-sdk/front-component';
import { LightButton, MainButton } from 'twenty-ui/components/input';
import { Callout } from 'twenty-ui/components/feedback';
import { IconCheck, IconExternalLink, IconRefresh, IconSettings } from 'twenty-ui/icon';
import { Status } from 'twenty-ui/primitives/data-display';
import { Loader } from 'twenty-ui/primitives/feedback';
import { Heading, Text } from 'twenty-ui/primitives/typography';
import { useTheme } from 'twenty-ui/theme';

import {
  IMPORT_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  IMPORT_PAGE_NAME,
} from 'src/constants/universal-identifiers';
import { isRunning, SOURCE_LABELS, SOURCE_PROVIDERS } from 'src/shuttio-api/contract';
import type {
  CheckoutResponse,
  CreateMigrationResponse,
  FieldTarget,
  MappingObject,
  MappingResponse,
  MigrationDetail,
  PriceOffer,
  SourceProvider,
  SaveMappingRequest,
  StatusResponse,
} from 'src/shuttio-api/contract';
import { MappingTable } from 'src/ui/mapping-table';
import { RunProgress } from 'src/ui/run-progress';
import { getSourceStatus, shuttio } from 'src/ui/shuttio-client';
import type { CallResult } from 'src/ui/shuttio-client';

type SourceStatus = {
  connected: boolean;
  handle: string | null;
  needsReconnect: boolean;
  applicationId: string | null;
};

type Failure = { title: string; message: string };

type StepKey = 'link' | 'source' | 'fields' | 'sample' | 'pay' | 'full';

const stepsFor = (label: string): { key: StepKey; title: string }[] => [
  { key: 'link', title: 'Link your Shuttio account' },
  { key: 'source', title: `Connect ${label}` },
  { key: 'fields', title: 'Review fields' },
  { key: 'sample', title: 'Free sample' },
  { key: 'pay', title: 'Pay' },
  { key: 'full', title: 'Full migration' },
];

const POLL_MS = 5_000;

const failureOf = (title: string, result: CallResult<unknown>): Failure | null =>
  result.ok ? null : { title, message: result.message };

const latestMigration = (status: StatusResponse, source: SourceProvider) =>
  [...status.migrations]
    .filter((migration) => migration.source === source && migration.status !== 'rolled_back')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

// The link page makes a migration of the chosen source.
const withSource = (link: string, source: SourceProvider) => {
  try {
    const url = new URL(link);
    url.searchParams.set('source', source);
    return url.toString();
  } catch {
    return link;
  }
};

const usd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const priceNote = (offer: PriceOffer | undefined, label: string) => {
  switch (offer) {
    case 'count_failed':
      return `Shuttio could not count the records in ${label}. Run the sample again or write to help@shuttio.com.`;
    case 'free':
      return 'The full migration is free.';
    case 'custom':
      return 'Over 5,000,000 records: write to help@shuttio.com for a price.';
    case 'unconfigured':
      return 'Payment is not available right now. Write to help@shuttio.com.';
    default:
      return `Shuttio is still counting the records in ${label}. The price appears when the count is done.`;
  }
};

const ImportPage = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [source, setSource] = useState<SourceProvider>('hubspot');
  const [connection, setConnection] = useState<SourceStatus | null>(null);
  // Set when Shuttio has no unstarted migration of this source: linking again makes one.
  const [relinkUrl, setRelinkUrl] = useState<string | null>(null);
  const label = SOURCE_LABELS[source];
  const STEPS = stepsFor(label);
  const [detail, setDetail] = useState<MigrationDetail | null>(null);
  const [mapping, setMapping] = useState<MappingObject[] | null>(null);
  const [mappingDirty, setMappingDirty] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<StepKey | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadDetail = useCallback(async (migrationId: string) => {
    const result = await shuttio.get<MigrationDetail>(`migrations/${migrationId}`);
    if (!mounted.current) return null;
    if (!result.ok) {
      setFailure(failureOf('Could not read the migration', result));
      return null;
    }
    setDetail(result.data);
    return result.data;
  }, []);

  const loadMapping = useCallback(async (migrationId: string) => {
    const result = await shuttio.get<MappingResponse>(`migrations/${migrationId}/mapping`);
    if (!mounted.current) return;
    if (!result.ok) {
      setFailure(failureOf(`Could not read the fields from ${SOURCE_LABELS[source]}`, result));
      return;
    }
    setMapping(result.data.objects);
    setMappingDirty(false);
  }, [source]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    const statusResult = await shuttio.get<StatusResponse>('status');
    if (!mounted.current) return;

    if (!statusResult.ok) {
      if (statusResult.code === 'link_required' && statusResult.linkUrl) {
        setLinkUrl(statusResult.linkUrl);
        setStatus(null);
      } else {
        setFailure(failureOf('Shuttio did not answer', statusResult));
      }
      setLoading(false);
      return;
    }

    setStatus(statusResult.data);
    setLinkUrl(statusResult.data.linkUrl ?? null);

    setRelinkUrl(null);
    const connectionResult = await getSourceStatus<SourceStatus>(source);
    if (!mounted.current) return;
    if (connectionResult.ok) {
      setConnection(connectionResult.data);
    } else {
      setFailure(failureOf(`Could not check the ${SOURCE_LABELS[source]} connection`, connectionResult));
    }

    const current = latestMigration(statusResult.data, source);
    if (current) {
      const loaded = await loadDetail(current.id);
      if (loaded && loaded.sourceConnected && !isRunning(loaded.status) && !loaded.paid) {
        await loadMapping(current.id);
      }
    } else {
      setDetail(null);
      setMapping(null);
    }
    if (mounted.current) setLoading(false);
  }, [loadDetail, loadMapping, source]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll only while Shuttio is working on this migration.
  const runningId = detail && isRunning(detail.status) ? detail.id : null;
  useEffect(() => {
    if (!runningId) return;
    const timer = setInterval(() => {
      void loadDetail(runningId);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [runningId, loadDetail]);

  const act = async <T,>(label: string, failTitle: string, call: () => Promise<CallResult<T>>) => {
    setBusy(label);
    setFailure(null);
    const result = await call();
    if (mounted.current) setBusy(null);
    if (!result.ok) {
      if (mounted.current) setFailure(failureOf(failTitle, result));
      return null;
    }
    return result.data;
  };

  const startMigration = async () => {
    setBusy('start');
    setFailure(null);
    const result = await shuttio.post<CreateMigrationResponse>('migrations', { source });
    if (!mounted.current) return;
    setBusy(null);
    if (!result.ok) {
      // Each migration connects Twenty once: Shuttio answers with a link that makes one of this source.
      if (result.code === 'link_required' && result.linkUrl) setRelinkUrl(result.linkUrl);
      else setFailure(failureOf('Could not start a migration', result));
      return;
    }
    const created = result.data;
    const attached = await act('start', `Shuttio could not read ${label}`, () =>
      shuttio.post<unknown>(`migrations/${created.id}/source`, { provider: source }),
    );
    if (attached === null) {
      await loadDetail(created.id);
      return;
    }
    await loadDetail(created.id);
    await loadMapping(created.id);
  };

  const saveMapping = async () => {
    if (!detail || !mapping) return;
    const body: SaveMappingRequest = {
      objects: mapping.map((object) => ({
        sourceObject: object.sourceObject,
        included: object.included,
        mapping: object.mapping,
      })),
    };
    const saved = await act('save', 'Could not save the fields', () =>
      shuttio.put<unknown>(`migrations/${detail.id}/mapping`, body),
    );
    if (saved === null) return;
    setMappingDirty(false);
    setOpenStep(null);
    await enqueueSnackbar({ message: 'Fields saved', variant: 'success' });
    await loadDetail(detail.id);
  };

  const startSample = async () => {
    if (!detail) return;
    const started = await act('sample', 'Could not start the sample', () =>
      shuttio.post<unknown>(`migrations/${detail.id}/sample`),
    );
    if (started !== null) await loadDetail(detail.id);
  };

  const openCheckout = async () => {
    if (!detail) return;
    const checkout = await act('checkout', 'Could not open Stripe Checkout', () =>
      shuttio.post<CheckoutResponse>(`migrations/${detail.id}/checkout`),
    );
    if (!checkout) return;
    if (checkout.url) {
      setCheckoutUrl(checkout.url);
      return;
    }
    await enqueueSnackbar({ message: 'Nothing to pay: the full migration has started', variant: 'success' });
    await loadDetail(detail.id);
  };

  const runFull = async () => {
    if (!detail) return;
    const answer = await openCommandConfirmationModal({
      title: 'Run the full migration?',
      subtitle:
        `Shuttio moves every remaining ${label} record into this workspace. Records the sample created are matched, not duplicated.`,
      confirmButtonText: 'Run full migration',
      confirmButtonAccent: 'blue',
    });
    if (answer !== 'confirm') return;
    const started = await act('run', 'Could not start the full migration', () =>
      shuttio.post<unknown>(`migrations/${detail.id}/run`),
    );
    if (started !== null) await loadDetail(detail.id);
  };

  const rollback = async () => {
    if (!detail) return;
    const answer = await openCommandConfirmationModal({
      title: 'Roll back this migration?',
      subtitle:
        'Shuttio deletes every record, note, task and link this migration created in Twenty, then the fields and empty objects it added. Records that were already here stay.',
      confirmButtonText: 'Roll back',
      confirmButtonAccent: 'danger',
    });
    if (answer !== 'confirm') return;
    const started = await act('rollback', 'Could not start the rollback', () =>
      shuttio.post<unknown>(`migrations/${detail.id}/rollback`),
    );
    if (started !== null) await loadDetail(detail.id);
  };

  const openAppSettings = async () => {
    if (!connection?.applicationId) return;
    await navigate(AppPath.SettingsCatchAll, { '*': `applications/${connection.applicationId}` });
  };

  const changeTarget = (sourceObject: string, sourceField: string, target: FieldTarget) => {
    setMapping((objects) =>
      (objects ?? []).map((object) =>
        object.sourceObject === sourceObject
          ? { ...object, mapping: { ...object.mapping, [sourceField]: target } }
          : object,
      ),
    );
    setMappingDirty(true);
  };

  const toggleObject = async (sourceObject: string, included: boolean) => {
    const next = (mapping ?? []).map((object) =>
      object.sourceObject === sourceObject ? { ...object, included } : object,
    );
    setMapping(next);
    setMappingDirty(true);
    // Shuttio sends no fields for an object that is not ticked: save the tick, then read them.
    const target = next.find((object) => object.sourceObject === sourceObject);
    if (!detail || !included || !target || target.sourceFields.length > 0) return;
    const body: SaveMappingRequest = {
      objects: next.map((object) => ({
        sourceObject: object.sourceObject,
        included: object.included,
        mapping: object.mapping,
      })),
    };
    const saved = await act('save', 'Could not read the fields of this object', () =>
      shuttio.put<unknown>(`migrations/${detail.id}/mapping`, body),
    );
    if (saved === null) return;
    setMappingDirty(false);
    await loadMapping(detail.id);
  };

  // Which steps are finished, from what Shuttio and Twenty report.
  const linked = status?.linked === true;
  const sourceReady = connection?.connected === true && detail?.sourceConnected === true;
  const sampleDone =
    detail !== null &&
    (detail.paid || detail.status === 'sample_done' || (!detail.isSample && detail.status !== 'setup'));
  const done: Record<StepKey, boolean> = {
    link: linked,
    source: sourceReady,
    fields: detail?.mappingSaved === true && !mappingDirty,
    sample: sampleDone,
    pay: detail?.paid === true,
    full: detail !== null && !detail.isSample && detail.status === 'done',
  };
  const currentStep = STEPS.find((step) => !done[step.key])?.key ?? 'full';
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  const renderStepBody = (key: StepKey): ReactNode => {
    switch (key) {
      case 'link':
        return (
          <>
            <Text>
              Shuttio runs the migration and writes into this workspace through its own Twenty
              connection. Sign in to Shuttio in a new tab, connect this workspace there, then come
              back.
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
              {linkUrl ? (
                <MainButton
                  href={withSource(linkUrl, source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<IconExternalLink size={16} />}
                >
                  Open Shuttio
                </MainButton>
              ) : (
                <MainButton disabled>Open Shuttio</MainButton>
              )}
              <LightButton startIcon={<IconRefresh size={16} />} onClick={() => void load()} loading={loading}>
                I’ve connected
              </LightButton>
            </div>
          </>
        );

      case 'source':
        if (!connection?.connected) {
          return (
            <>
              <Text>
                {connection?.needsReconnect
                  ? `The ${label} connection${connection.handle ? ` (${connection.handle})` : ''} stopped working. Reconnect it in the Shuttio app settings.`
                  : `Connect the ${label} account to import from. Open Settings → Apps → Shuttio and click Add connection in the ${label} section.${source === 'hubspot' ? ' HubSpot asks a super admin to approve read access.' : ''}`}
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
                <MainButton
                  startIcon={<IconSettings size={16} />}
                  onClick={() => void openAppSettings()}
                  disabled={!connection?.applicationId}
                >
                  Open Shuttio settings
                </MainButton>
                <LightButton startIcon={<IconRefresh size={16} />} onClick={() => void load()} loading={loading}>
                  Check again
                </LightButton>
              </div>
            </>
          );
        }
        return (
          <>
            <Text>
              {label} is connected{connection.handle ? ` as ${connection.handle}` : ''}. Shuttio reads its
              objects and fields next. Nothing is written yet.
            </Text>
            {relinkUrl ? (
              <>
                <Text>
                  Each migration connects Twenty once. Open Shuttio to set up the {label} migration,
                  then come back and press Read {label} again.
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
                  <MainButton href={relinkUrl} target="_blank" rel="noopener noreferrer" endIcon={<IconExternalLink size={16} />}>
                    Open Shuttio
                  </MainButton>
                  <LightButton onClick={() => void startMigration()} loading={busy === 'start'} disabled={busy !== null}>
                    Read {label}
                  </LightButton>
                </div>
              </>
            ) : (
              <div>
                <MainButton onClick={() => void startMigration()} loading={busy === 'start'} disabled={busy !== null}>
                  Read {label}
                </MainButton>
              </div>
            )}
          </>
        );

      case 'fields':
        if (!detail?.sourceConnected) {
          return <Text>Connect {label} first.</Text>;
        }
        if (mapping === null) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}>
              <Loader />
              <Text>Reading fields from {label}…</Text>
            </div>
          );
        }
        return (
          <>
            <Text>
              Choose where each {label} field lands in Twenty. “New field” adds it to Twenty; “Skip”
              leaves it out. People match by email and companies by domain, so records already here
              are linked, not duplicated.
            </Text>
            <MappingTable
              objects={mapping}
              disabled={busy !== null || (detail !== null && isRunning(detail.status))}
              onToggleObject={(sourceObject, included) => void toggleObject(sourceObject, included)}
              onChangeTarget={changeTarget}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
              <MainButton onClick={() => void saveMapping()} loading={busy === 'save'} disabled={busy !== null}>
                Save fields
              </MainButton>
              {mappingDirty && <Text style={{ color: theme.font.color.tertiary }}>Unsaved changes</Text>}
            </div>
          </>
        );

      case 'sample':
        if (!detail) return null;
        if (detail.isSample && isRunning(detail.status)) {
          return (
            <>
              <Text>Shuttio is writing the sample into this workspace.</Text>
              <RunProgress detail={detail} />
            </>
          );
        }
        if (detail.status === 'sample_done') {
          return (
            <>
              <Text>The sample is in Twenty. Open a few records and check them before you pay.</Text>
              <RunProgress detail={detail} />
              <div>
                <LightButton onClick={() => void rollback()} loading={busy === 'rollback'} disabled={busy !== null}>
                  Roll back sample
                </LightButton>
              </div>
            </>
          );
        }
        return (
          <>
            <Text>
              Shuttio copies 5% of each object, 10 to 1,000 records, picked at random, with their
              links, notes and tasks. Free. You check the result in Twenty before anything else moves.
            </Text>
            <div>
              <MainButton onClick={() => void startSample()} loading={busy === 'sample'} disabled={busy !== null}>
                Run free sample
              </MainButton>
            </div>
          </>
        );

      case 'pay': {
        if (!detail) return null;
        const price = detail.price;
        return (
          <>
            <Text>
              {price
                ? `${price.recordCount !== null ? `${price.recordCount.toLocaleString('en-US')} records in ${label}. ` : ''}The full migration costs ${usd(price.amountUsd)}, paid once.`
                : priceNote(detail.offer, label)}
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
              {checkoutUrl ? (
                <MainButton
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<IconExternalLink size={16} />}
                >
                  Open Stripe Checkout
                </MainButton>
              ) : (
                <MainButton
                  onClick={() => void openCheckout()}
                  loading={busy === 'checkout'}
                  disabled={busy !== null || !price}
                >
                  {price ? `Pay ${usd(price.amountUsd)}` : 'Pay'}
                </MainButton>
              )}
              <LightButton startIcon={<IconRefresh size={16} />} onClick={() => void load()} loading={loading}>
                I’ve paid
              </LightButton>
            </div>
          </>
        );
      }

      case 'full': {
        if (!detail) return null;
        const fullRunning = !detail.isSample && detail.status === 'running';
        const rollingBack = detail.status === 'rolling_back';
        return (
          <>
            {detail.paid && detail.isSample && !isRunning(detail.status) && (
              <>
                <Text>Payment received. Start the full migration when you are ready.</Text>
                <div>
                  <MainButton onClick={() => void runFull()} loading={busy === 'run'} disabled={busy !== null}>
                    Run full migration
                  </MainButton>
                </div>
              </>
            )}
            {(fullRunning || rollingBack || (!detail.isSample && detail.status !== 'setup')) && (
              <>
                <Text>
                  {rollingBack
                    ? 'Shuttio is removing what this migration created.'
                    : fullRunning
                      ? 'Shuttio is moving every record. You can leave this page; the run continues.'
                      : detail.status === 'done'
                        ? 'The migration is finished.'
                        : `The migration is ${detail.status.replace('_', ' ')}.`}
                </Text>
                <RunProgress detail={detail} />
              </>
            )}
            {!detail.isSample && (detail.status === 'done' || detail.status === 'failed') && (
              <div>
                <LightButton onClick={() => void rollback()} loading={busy === 'rollback'} disabled={busy !== null}>
                  Roll back
                </LightButton>
              </div>
            )}
          </>
        );
      }
    }
  };

  return (
    <div
      style={{
        boxSizing: 'border-box',
        padding: theme.spacing['6'],
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing['4'],
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] }}>
          <Heading level={1} size="lg">
            Import from {label}
          </Heading>
          <div role="group" aria-label="Source" style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
            {SOURCE_PROVIDERS.map((provider) =>
              provider === source ? (
                <MainButton key={provider} size="sm" aria-pressed>
                  {SOURCE_LABELS[provider]}
                </MainButton>
              ) : (
                <LightButton
                  key={provider}
                  size="sm"
                  aria-pressed={false}
                  disabled={busy !== null}
                  onClick={() => {
                    setDetail(null);
                    setMapping(null);
                    setConnection(null);
                    setOpenStep(null);
                    setSource(provider);
                  }}
                >
                  {SOURCE_LABELS[provider]}
                </LightButton>
              ),
            )}
          </div>
          <Text style={{ color: theme.font.color.secondary }}>
            Shuttio copies companies, contacts, deals, custom objects, notes and tasks into this
            workspace, with the links between them.
            {status?.account?.email ? ` Signed in to Shuttio as ${status.account.email}.` : ''}
          </Text>
        </div>

        {failure && (
          <Callout
            status="error"
            title={failure.title}
            description={failure.message}
            action={
              <Callout.Action onClick={() => void load()}>Try again</Callout.Action>
            }
            onDismiss={() => setFailure(null)}
            closeLabel="Dismiss error"
            fullWidth
          />
        )}

        {status === null && linkUrl === null ? (
          loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}>
            <Loader />
            <Text>Checking Shuttio…</Text>
          </div>
          )
        ) : (
          STEPS.map((step, index) => {
            const isDone = done[step.key];
            const isCurrent = step.key === currentStep;
            const isLocked = index > currentIndex;
            const canReopen =
              isDone && step.key === 'fields' && detail !== null && detail.isSample && !isRunning(detail.status) && !detail.paid;
            const expanded = isCurrent || openStep === step.key || (step.key === 'sample' && isDone && detail?.isSample === true && !detail.paid) || (step.key === 'full' && detail !== null && !detail.isSample);
            return (
              <section
                key={step.key}
                aria-label={step.title}
                style={{
                  border: `1px solid ${isCurrent ? theme.border.color.strong : theme.border.color.light}`,
                  borderRadius: theme.border.radius.md,
                  background: theme.background.primary,
                  padding: `${theme.spacing['3']} ${theme.spacing['4']}`,
                }}
              >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: theme.spacing['2'],
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'], minWidth: 0 }}>
                      {isDone ? (
                        <IconCheck size={16} color={theme.font.color.secondary} aria-hidden />
                      ) : (
                        <Text style={{ color: theme.font.color.tertiary, minWidth: 16 }}>{index + 1}</Text>
                      )}
                      <Heading level={2} size="sm" color={isLocked ? 'tertiary' : 'primary'}>
                        {step.title}
                      </Heading>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}>
                      {isDone && <Status color="green">Done</Status>}
                      {isCurrent && !isDone && <Status color="blue">Next</Status>}
                      {canReopen && openStep !== step.key && (
                        <LightButton size="sm" onClick={() => setOpenStep(step.key)}>
                          Edit
                        </LightButton>
                      )}
                    </div>
                  </div>
                {expanded && !isLocked && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: theme.spacing['3'],
                      marginTop: theme.spacing['3'],
                    }}
                  >
                    {renderStepBody(step.key)}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: IMPORT_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'import-page',
  description: `${IMPORT_PAGE_NAME}: link Shuttio, connect HubSpot, Attio or Pipedrive, map fields, run a sample, pay, migrate`,
  component: ImportPage,
});
