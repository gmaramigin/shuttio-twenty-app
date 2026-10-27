import { describe, expect, it } from 'vitest';

import { isSourceProvider, SOURCE_LABELS, SOURCE_PROVIDERS } from 'src/shuttio-api/contract';

describe('source providers', () => {
  it('takes HubSpot, Attio and Pipedrive and nothing else', () => {
    expect(SOURCE_PROVIDERS).toEqual(['hubspot', 'attio', 'pipedrive']);
    for (const provider of SOURCE_PROVIDERS) expect(isSourceProvider(provider)).toBe(true);
    expect(isSourceProvider('salesforce')).toBe(false);
    expect(isSourceProvider(undefined)).toBe(false);
  });

  it('names each provider', () => {
    expect(SOURCE_LABELS).toEqual({ hubspot: 'HubSpot', attio: 'Attio', pipedrive: 'Pipedrive' });
  });
});
