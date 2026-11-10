import { defineLogicFunction } from 'twenty-sdk/define';
import type { IdentifyAccountPayload, IdentifyAccountResult } from 'twenty-sdk/logic-function';

import { CAPSULE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readCapsuleSite } from 'src/shuttio-api/sources';

// Pins a connection to one Capsule account, so a reconnect cannot switch accounts
// under a migration that already holds that account's ids.
export default defineLogicFunction({
  universalIdentifier: CAPSULE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'capsule-identify-account',
  description: 'Returns the Capsule account subdomain behind a new connection',
  timeoutSeconds: 10,
  handler: async ({ accessToken }: IdentifyAccountPayload): Promise<IdentifyAccountResult> => {
    const site = await readCapsuleSite(accessToken);
    return { externalAccountId: site.subdomain, handle: site.name ?? `${site.subdomain}.capsulecrm.com` };
  },
});
