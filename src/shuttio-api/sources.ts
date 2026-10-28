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

// Pipedrive names the company behind a token on its shared API host.
export const readPipedriveSelf = async (accessToken: string) => {
  const json = await getJson('https://api.pipedrive.com/v1/users/me', accessToken, 'Pipedrive');
  const data = json.data as { company_id?: unknown; company_name?: unknown } | undefined;
  if (typeof data?.company_id !== 'number' && typeof data?.company_id !== 'string') {
    throw new Error('Pipedrive did not name the company behind the token');
  }
  return {
    companyId: String(data.company_id),
    companyName: typeof data.company_name === 'string' ? data.company_name : null,
  };
};
