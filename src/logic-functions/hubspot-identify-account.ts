import { defineLogicFunction } from 'twenty-sdk/define';
import type { IdentifyAccountPayload, IdentifyAccountResult } from 'twenty-sdk/logic-function';

import { HUBSPOT_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readHubspotTokenInfo } from 'src/shuttio-api/hubspot';

// Pins a connection to one HubSpot portal, so a reconnect cannot switch portals
// under a migration that already holds that portal's ids.
export default defineLogicFunction({
  universalIdentifier: HUBSPOT_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'hubspot-identify-account',
  description: 'Returns the HubSpot portal id behind a new connection',
  timeoutSeconds: 10,
  handler: async ({ accessToken }: IdentifyAccountPayload): Promise<IdentifyAccountResult> => {
    const info = await readHubspotTokenInfo(accessToken);
    return {
      externalAccountId: String(info.hubId),
      handle: info.hubDomain ?? `HubSpot portal ${info.hubId}`,
    };
  },
});
