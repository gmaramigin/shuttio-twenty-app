// What the import page derives from Shuttio's answers: which source the page shows, which steps are done,
// and how a record link opens. Pure, so the rules are tested apart from the page.
import { isSourceProvider } from 'src/shuttio-api/contract';
import type { MigrationDetail, SourceProvider, StatusResponse } from 'src/shuttio-api/contract';

export type StepKey = 'link' | 'source' | 'fields' | 'sample' | 'pay' | 'full';

export const SOURCE_STORAGE_KEY = 'shuttio.import.source';

// The source of the newest migration that is not rolled back, else the one this
// browser chose last, else HubSpot.
export const initialSource = (
  status: StatusResponse | null,
  remembered: string | null,
): SourceProvider => {
  const newest = [...(status?.migrations ?? [])]
    .filter((migration) => migration.status !== 'rolled_back' && isSourceProvider(migration.source))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (newest && isSourceProvider(newest.source)) return newest.source;
  return isSourceProvider(remembered) ? remembered : 'hubspot';
};

// localStorage may be missing or refuse in the front-component sandbox: never throw.
export const readRememberedSource = (): string | null => {
  try {
    return globalThis.localStorage?.getItem(SOURCE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
};

export const rememberSource = (source: SourceProvider) => {
  try {
    globalThis.localStorage?.setItem(SOURCE_STORAGE_KEY, source);
  } catch {
    // Not kept: the page falls back to the newest migration's source.
  }
};

// Which steps are finished. A migration that left setup had its fields saved (Shuttio
// drops the saved draft once a run starts); a finished sample is done.
export const doneSteps = (o: {
  linked: boolean;
  sourceConnected: boolean;
  detail: MigrationDetail | null;
  mappingDirty: boolean;
}): Record<StepKey, boolean> => {
  const { detail } = o;
  const started = detail !== null && detail.status !== 'setup';
  const sampleDone =
    detail !== null &&
    (detail.paid || detail.status === 'sample_done' || (!detail.isSample && started));
  return {
    link: o.linked,
    source: o.sourceConnected,
    fields: started || (detail?.mappingSaved === true && !o.mappingDirty),
    sample: sampleDone,
    pay: detail?.paid === true,
    full: detail !== null && !detail.isSample && detail.status === 'done',
  };
};

// The fields can still change only while the migration is in setup (Shuttio answers
// 409 already_started after that).
export const canEditFields = (detail: MigrationDetail | null) =>
  detail !== null && detail.status === 'setup';

// A record link from Shuttio, as a path inside Twenty when it is one: "/object/person/<id>",
// absolute or not.
const RECORD_PATH = /^\/object\/([A-Za-z0-9_]+)\/([0-9a-f-]{36})$/;
export const recordInTwenty = (url: string): { object: string; id: string } | null => {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // Already a path.
  }
  const hit = RECORD_PATH.exec(path);
  return hit ? { object: hit[1], id: hit[2] } : null;
};
