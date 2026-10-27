import { defineLogicFunction } from 'twenty-sdk/define';

import { HUBSPOT_STATUS_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { SOURCE_STATUS_ROUTE } from 'src/shuttio-api/contract';
import { findSourceConnection, isSourceProvider } from 'src/shuttio-api/sources';

export type SourceStatus = {
  connected: boolean;
  handle: string | null;
  needsReconnect: boolean;
  applicationId: string | null;
};

// Tells the page whether the workspace has a connection for `?provider=` (HubSpot when
// absent). Never returns a token.
export default defineLogicFunction({
  universalIdentifier: HUBSPOT_STATUS_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'hubspot-status',
  description: 'Reports whether this workspace has a working HubSpot, Attio or Pipedrive connection',
  timeoutSeconds: 10,
  httpRouteTriggerSettings: {
    path: SOURCE_STATUS_ROUTE,
    httpMethod: 'GET',
    isAuthRequired: true,
  },
  handler: async (event: RoutePayload): Promise<SourceStatus> => {
    const asked = event.queryStringParameters?.provider ?? 'hubspot';
    const provider = isSourceProvider(asked) ? asked : 'hubspot';
    const { usable, failed } = await findSourceConnection(provider);
    return {
      connected: usable !== null,
      handle: usable?.handle ?? failed?.handle ?? null,
      needsReconnect: usable === null && failed !== null,
      applicationId: process.env.APPLICATION_ID ?? null,
    };
  },
});
