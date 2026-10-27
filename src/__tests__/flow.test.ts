import { describe, expect, it } from 'vitest';

import type { MigrationDetail, StatusResponse } from 'src/shuttio-api/contract';
import { applicationIdFromToken } from 'src/shuttio-api/app-token';
import {
  canEditFields,
  doneSteps,
  initialSource,
  recordInTwenty,
} from 'src/ui/flow';

const status = (migrations: StatusResponse['migrations']): StatusResponse => ({ linked: true, migrations });

const detail = (over: Partial<MigrationDetail>): MigrationDetail => ({
  id: 'm1',
  source: 'attio',
  status: 'setup',
  sourceConnected: true,
  mappingSaved: false,
  isSample: true,
  paid: false,
  objects: [],
  errors: [],
  links: [],
  ...over,
});

describe('initialSource', () => {
  it('takes the source of the newest migration that is not rolled back', () => {
    const s = status([
      { id: 'a', source: 'hubspot', status: 'done', createdAt: '2026-10-01T00:00:00Z' },
      { id: 'b', source: 'attio', status: 'sample_done', createdAt: '2026-10-27T00:00:00Z' },
      { id: 'c', source: 'pipedrive', status: 'rolled_back', createdAt: '2026-10-28T00:00:00Z' },
    ]);
    expect(initialSource(s, 'pipedrive')).toBe('attio');
  });

  it('falls back to the remembered choice, then HubSpot', () => {
    expect(initialSource(status([]), 'pipedrive')).toBe('pipedrive');
    expect(initialSource(null, 'salesforce')).toBe('hubspot');
    expect(initialSource(null, null)).toBe('hubspot');
  });
});

describe('doneSteps', () => {
  const base = { linked: true, sourceConnected: true, mappingDirty: false };

  it('a finished sample shows the sample step done and Pay next, not Review fields again', () => {
    const done = doneSteps({ ...base, detail: detail({ status: 'sample_done', mappingSaved: false }) });
    expect(done).toMatchObject({ link: true, source: true, fields: true, sample: true, pay: false });
  });

  it('in setup the fields are done only once saved and unchanged', () => {
    expect(doneSteps({ ...base, detail: detail({ mappingSaved: true }) }).fields).toBe(true);
    expect(doneSteps({ ...base, mappingDirty: true, detail: detail({ mappingSaved: true }) }).fields).toBe(false);
    expect(doneSteps({ ...base, detail: detail({}) }).sample).toBe(false);
  });

  it('only a migration in setup can change its fields', () => {
    expect(canEditFields(detail({}))).toBe(true);
    expect(canEditFields(detail({ status: 'sample_done' }))).toBe(false);
    expect(canEditFields(null)).toBe(false);
  });
});

describe('applicationIdFromToken', () => {
  const jwt = (claims: object) => `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`;

  it('reads the applicationId claim', () => {
    expect(applicationIdFromToken(jwt({ applicationId: '6faee3d9-41df-47f8-8b45-022af84aae11' }))).toBe(
      '6faee3d9-41df-47f8-8b45-022af84aae11',
    );
  });

  it('answers null for anything else', () => {
    expect(applicationIdFromToken(undefined)).toBeNull();
    expect(applicationIdFromToken('not-a-jwt')).toBeNull();
    expect(applicationIdFromToken(jwt({ applicationId: '../x' }))).toBeNull();
  });
});

describe('recordInTwenty', () => {
  it('opens a record link inside Twenty, absolute or not', () => {
    const id = '0b7e6f0e-1c1e-4a55-9a43-6b5d3f1f2e10';
    expect(recordInTwenty(`https://craftt.twenty.com/object/person/${id}`)).toEqual({ object: 'person', id });
    expect(recordInTwenty(`/object/company/${id}`)).toEqual({ object: 'company', id });
    expect(recordInTwenty('https://www.shuttio.com/blueprint/x')).toBeNull();
  });
});

describe('withOneRetry', () => {
  it('sends a GET that never reached Twenty once more, and nothing else', async () => {
    const { withOneRetry } = await import('src/ui/shuttio-client');
    let calls = 0;
    const lost = await withOneRetry(async () => (++calls === 1 ? { ok: false as const, status: 0, code: 'http_0', message: 'x' } : { ok: true as const, data: 1 }));
    expect(lost).toEqual({ ok: true, data: 1 });
    expect(calls).toBe(2);
    calls = 0;
    await withOneRetry(async () => { calls++; return { ok: false as const, status: 409, code: 'already_started', message: 'x' }; });
    expect(calls).toBe(1);
  });
});
