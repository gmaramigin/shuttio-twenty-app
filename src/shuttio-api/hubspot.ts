import { findSourceConnection } from 'src/shuttio-api/sources';

export const HUBSPOT_PROVIDER_NAME = 'hubspot';

export type HubspotTokenInfo = {
  hubId: number;
  hubDomain: string | null;
  expiresInSeconds: number | null;
};

// HubSpot describes its own access token: portal id, domain, seconds left.
export const readHubspotTokenInfo = async (accessToken: string): Promise<HubspotTokenInfo> => {
  const response = await fetch(
    `https://api.hubapi.com/oauth/v1/access-tokens/${encodeURIComponent(accessToken)}`,
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) {
    throw new Error(`HubSpot rejected the token (${response.status})`);
  }
  const data = (await response.json()) as {
    hub_id?: number;
    hub_domain?: string;
    expires_in?: number;
  };
  if (typeof data.hub_id !== 'number') {
    throw new Error('HubSpot did not name the portal behind the token');
  }
  return {
    hubId: data.hub_id,
    hubDomain: data.hub_domain ?? null,
    expiresInSeconds: typeof data.expires_in === 'number' ? data.expires_in : null,
  };
};

// The workspace's HubSpot connection: the first shared one that still works.
export const findHubspotConnection = () => findSourceConnection('hubspot');
