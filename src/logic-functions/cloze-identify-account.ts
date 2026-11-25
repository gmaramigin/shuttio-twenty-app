import { defineLogicFunction } from 'twenty-sdk/define';
import type { IdentifyAccountPayload, IdentifyAccountResult } from 'twenty-sdk/logic-function';

import { CLOZE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readClozeProfile } from 'src/shuttio-api/sources';

// Pins a connection to one Cloze account, so a reconnect cannot switch accounts
// under a migration that already holds that account's ids.
export default defineLogicFunction({
  universalIdentifier: CLOZE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'cloze-identify-account',
  description: 'Returns the Cloze account id behind a new connection',
  timeoutSeconds: 10,
  handler: async ({ accessToken }: IdentifyAccountPayload): Promise<IdentifyAccountResult> => {
    const profile = await readClozeProfile(accessToken);
    return { externalAccountId: profile.accountId, handle: profile.email ?? profile.name ?? 'Cloze' };
  },
});
