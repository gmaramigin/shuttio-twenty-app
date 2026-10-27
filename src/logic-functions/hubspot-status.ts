import { defineLogicFunction } from 'twenty-sdk/define';

import { HUBSPOT_STATUS_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { HUBSPOT_STATUS_ROUTE } from 'src/shuttio-api/contract';
import { findHubspotConnection } from 'src/shuttio-api/hubspot';

export type HubspotStatus = {
  connected: boolean;
  handle: string | null;
  needsReconnect: boolean;
  applicationId: string | null;
};

// Tells the page whether the workspace has a HubSpot connection. Never returns a token.
export default defineLogicFunction({
  universalIdentifier: HUBSPOT_STATUS_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'hubspot-status',
  description: 'Reports whether this workspace has a working HubSpot connection',
  timeoutSeconds: 10,
  httpRouteTriggerSettings: {
    path: HUBSPOT_STATUS_ROUTE,
    httpMethod: 'GET',
    isAuthRequired: true,
  },
  handler: async (): Promise<HubspotStatus> => {
    const { usable, failed } = await findHubspotConnection();
    return {
      connected: usable !== null,
      handle: usable?.handle ?? failed?.handle ?? null,
      needsReconnect: usable === null && failed !== null,
      applicationId: process.env.APPLICATION_ID ?? null,
    };
  },
});
