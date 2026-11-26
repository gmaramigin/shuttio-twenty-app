import { afterEach, describe, expect, it, vi } from 'vitest';

import { readClozeProfile } from 'src/shuttio-api/sources';
import { isSourceProvider, SOURCE_LABELS, SOURCE_PROVIDERS } from 'src/shuttio-api/contract';

describe('source providers', () => {
  it('takes HubSpot, Attio, Capsule and Cloze and nothing else', () => {
    expect(SOURCE_PROVIDERS).toEqual(['hubspot', 'attio', 'capsule', 'cloze']);
    for (const provider of SOURCE_PROVIDERS) expect(isSourceProvider(provider)).toBe(true);
    expect(isSourceProvider('salesforce')).toBe(false);
    expect(isSourceProvider(undefined)).toBe(false);
  });

  it('names each provider', () => {
    expect(SOURCE_LABELS).toEqual({ hubspot: 'HubSpot', attio: 'Attio', capsule: 'Capsule', cloze: 'Cloze' });
  });
});

describe('readClozeProfile', () => {
  afterEach(() => vi.unstubAllGlobals());
  const answer = (body: unknown, status = 200) =>
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

  it('takes the profile key as the account id', async () => {
    answer({ errorcode: 0, profile: { key: 'k-1', email: 'Me@Acme.test', name: 'Me' } });
    expect(await readClozeProfile('t')).toEqual({ accountId: 'k-1', email: 'Me@Acme.test', name: 'Me' });
  });

  it('falls back to the lower-case email without a key', async () => {
    answer({ profile: { email: 'Me@Acme.test' } });
    expect((await readClozeProfile('t')).accountId).toBe('me@acme.test');
  });

  it('refuses a profile with neither, and a rejected token', async () => {
    answer({ profile: {} });
    await expect(readClozeProfile('t')).rejects.toThrow('did not name the account');
    answer({}, 401);
    await expect(readClozeProfile('t')).rejects.toThrow('rejected the token');
  });
});
