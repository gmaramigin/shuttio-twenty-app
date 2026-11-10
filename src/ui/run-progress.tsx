import { useState, type ReactNode } from 'react';
import { AppPath, navigate } from 'twenty-sdk/front-component';
import { LightButton, MainButton } from 'twenty-ui/components/input';
import { Callout } from 'twenty-ui/components/feedback';
import { IconChevronDown, IconChevronRight, IconExternalLink } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { ProgressBar } from 'twenty-ui/primitives/feedback';
import { Collapsible } from 'twenty-ui/primitives/layout';
import { Text } from 'twenty-ui/primitives/typography';
import { useTheme } from 'twenty-ui/theme';

import { isRunning, type MigrationDetail } from 'src/shuttio-api/contract';
import { recordInTwenty } from 'src/ui/flow';
import { splitWarnings, summaryLine, visibleObjects } from 'src/ui/run-summary';

const percent = (done: number, failed: number, total: number | null) =>
  total && total > 0 ? Math.min(100, Math.round(((done + failed) / total) * 100)) : 0;

const count = (value: number) => value.toLocaleString('en-US');

const Disclosure = ({ title, children }: { title: string; children: ReactNode }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const Chevron = open ? IconChevronDown : IconChevronRight;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing['1'],
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: theme.font.color.secondary,
          font: 'inherit',
        }}
      >
        <Chevron size={14} />
        <Text style={{ color: theme.font.color.secondary }}>{title}</Text>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing['1'],
            paddingTop: theme.spacing['2'],
            paddingLeft: theme.spacing['5'],
          }}
        >
          {children}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};

export const RunProgress = ({ detail }: { detail: MigrationDetail }) => {
  const theme = useTheme();
  const running = isRunning(detail.status);
  const objects = visibleObjects(detail.objects);
  const { action, info } = splitWarnings(detail.warnings);
  const skipped = detail.skippedLinks ?? [];
  const column = { display: 'flex', flexDirection: 'column', gap: theme.spacing['1'] } as const;
  const muted = { color: theme.font.color.secondary };

  const objectRow = (object: (typeof objects)[number]) => (
    <div
      key={object.name}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: theme.spacing['2'] }}
    >
      <Text>{object.label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing['2'] }}>
        {object.failed > 0 && <Tag color="red">{count(object.failed)} failed</Tag>}
        <Text style={{ color: theme.font.color.tertiary }}>
          {count(object.done)}
          {object.total !== null ? ` of ${count(object.total)}` : ''}
        </Text>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['4'] }}>
      {running ? (
        <>
          {detail.objects.length === 0 && <Text>Waiting for the first object to start…</Text>}
          {detail.objects.map((object) => (
            <div key={object.name} style={column}>
              {objectRow(object)}
              <ProgressBar
                aria-label={`${object.label} progress`}
                value={percent(object.done, object.failed, object.total)}
                backgroundColor={theme.background.tertiary}
                withBorderRadius
              />
            </div>
          ))}
        </>
      ) : (
        objects.length > 0 && (
          <div style={column}>
            <Text style={{ fontWeight: theme.font.weight.medium }}>{summaryLine(detail)}</Text>
            {objects.filter((object) => object.failed > 0).map(objectRow)}
            <Disclosure title="Records by object">{objects.map(objectRow)}</Disclosure>
          </div>
        )
      )}

      {!running && detail.links.length > 0 && (
        <div style={column}>
          <Text style={muted}>Open a few records and check them:</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing['2'] }}>
            {detail.links.slice(0, 6).map((link) => {
              // A record of this workspace opens here, not in a new tab.
              const inTwenty = recordInTwenty(link.url);
              return inTwenty ? (
                <MainButton
                  key={link.url}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void navigate(AppPath.RecordShowPage, {
                      objectNameSingular: inTwenty.object,
                      objectRecordId: inTwenty.id,
                    })
                  }
                >
                  {link.label}
                </MainButton>
              ) : (
                <MainButton
                  key={link.url}
                  variant="outline"
                  size="sm"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<IconExternalLink size={14} />}
                >
                  {link.label}
                </MainButton>
              );
            })}
          </div>
        </div>
      )}

      {detail.error && <Callout status="error" title={detail.error} />}

      {detail.errors.length > 0 && (
        <Callout
          status="error"
          title="Records that did not import"
          description={
            <div style={column}>
              {detail.errors.slice(0, 8).map((error, index) => (
                <span key={`${error.object}-${index}`}>
                  {error.object}: {error.message} ({count(error.count)})
                </span>
              ))}
            </div>
          }
        />
      )}

      {action.length > 0 && (
        <Callout
          status="warning"
          title={action.length === 1 ? 'Needs your action' : `${action.length} things need your action`}
          description={
            <div style={{ ...column, color: theme.font.color.primary }}>
              {action.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
          }
        />
      )}

      {(info.length > 0 || skipped.length > 0 || detail.resultsUrl) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['2'] }}>
          {info.length > 0 && (
            <Disclosure title={`${info.length} ${info.length === 1 ? 'note' : 'notes'} on how data was placed`}>
              {info.map((warning) => (
                <Text key={warning} style={muted}>
                  {warning}
                </Text>
              ))}
            </Disclosure>
          )}
          {skipped.length > 0 && (
            <Disclosure title="Records imported without some links">
              {skipped.slice(0, 8).map((line) => (
                <Text key={line} style={muted}>
                  {line}
                </Text>
              ))}
            </Disclosure>
          )}
          {detail.resultsUrl && (
            <div>
              <LightButton
                size="sm"
                href={detail.resultsUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<IconExternalLink size={14} />}
              >
                Full report on shuttio.com
              </LightButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
