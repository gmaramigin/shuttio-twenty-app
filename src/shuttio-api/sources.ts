import { listConnections } from 'twenty-sdk/logic-function';
import type { AppConnection } from 'twenty-sdk/logic-function';

import type { SourceProvider } from 'src/shuttio-api/contract';

export { isSourceProvider, SOURCE_LABELS } from 'src/shuttio-api/contract';

// The workspace's connection for a source: the first shared one that still works.
export const findSourceConnection = async (
  provider: SourceProvider,
): Promise<{ usable: AppConnection | null; failed: AppConnection | null }> => {
  const connections = await listConnections({ providerName: provider });
  const shared = connections.filter((connection) => connection.scope === 'WORKSPACE');
  return {
    usable: shared.find((connection) => !connection.authFailedAt) ?? null,
    failed: shared.find((connection) => connection.authFailedAt) ?? null,
  };
};

const getJson = async (url: string, accessToken: string, name: string) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`${name} rejected the token (${response.status})`);
  }
  return (await response.json()) as Record<string, unknown>;
};

// Attio describes its token: the workspace it opens.
export const readAttioSelf = async (accessToken: string) => {
  const json = await getJson('https://api.attio.com/v2/self', accessToken, 'Attio');
  const data = (json.data ?? json) as { workspace_id?: unknown; workspace_name?: unknown };
  if (typeof data.workspace_id !== 'string') {
    throw new Error('Attio did not name the workspace behind the token');
  }
  return {
    workspaceId: data.workspace_id,
    workspaceName: typeof data.workspace_name === 'string' ? data.workspace_name : null,
  };
};


// Cloze names the account behind a token: GET /v1/user/profile answers the user's `key` (the account id) and email.
export const readClozeProfile = async (accessToken: string) => {
  const json = await getJson('https://api.cloze.com/v1/user/profile', accessToken, 'Cloze');
  const p = (json.profile ?? json.user ?? {}) as { key?: unknown; email?: unknown; name?: unknown };
  const email = typeof p.email === 'string' ? p.email.trim() : '';
  const key = typeof p.key === 'string' ? p.key.trim() : '';
  const accountId = key || email.toLowerCase();
  if (!accountId) {
    throw new Error('Cloze did not name the account behind the token');
  }
  return { accountId, email: email || null, name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : null };
};

// Capsule names the account behind a token: GET /api/v2/site answers its subdomain and name.
export const readCapsuleSite = async (accessToken: string) => {
  const json = await getJson('https://api.capsulecrm.com/api/v2/site', accessToken, 'Capsule');
  const site = (json.site ?? {}) as { subdomain?: unknown; name?: unknown };
  if (typeof site.subdomain !== 'string' || !site.subdomain) {
    throw new Error('Capsule did not name the account behind the token');
  }
  return { subdomain: site.subdomain, name: typeof site.name === 'string' && site.name ? site.name : null };
};
