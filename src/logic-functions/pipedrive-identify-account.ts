import { defineLogicFunction } from 'twenty-sdk/define';
import type { IdentifyAccountPayload, IdentifyAccountResult } from 'twenty-sdk/logic-function';

import { PIPEDRIVE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readPipedriveSelf } from 'src/shuttio-api/sources';

// Pins a connection to one Pipedrive company, so a reconnect cannot switch companies
// under a migration that already holds that company's ids.
export default defineLogicFunction({
  universalIdentifier: PIPEDRIVE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'pipedrive-identify-account',
  description: 'Returns the Pipedrive company id behind a new connection',
  timeoutSeconds: 10,
  handler: async ({ accessToken }: IdentifyAccountPayload): Promise<IdentifyAccountResult> => {
    const me = await readPipedriveSelf(accessToken);
    return { externalAccountId: me.companyId, handle: me.companyName ?? `Pipedrive company ${me.companyId}` };
  },
});
