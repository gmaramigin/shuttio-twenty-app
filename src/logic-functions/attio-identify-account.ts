import { defineLogicFunction } from 'twenty-sdk/define';
import type { IdentifyAccountPayload, IdentifyAccountResult } from 'twenty-sdk/logic-function';

import { ATTIO_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readAttioSelf } from 'src/shuttio-api/sources';

// Pins a connection to one Attio workspace, so a reconnect cannot switch workspaces
// under a migration that already holds that workspace's ids.
export default defineLogicFunction({
  universalIdentifier: ATTIO_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'attio-identify-account',
  description: 'Returns the Attio workspace id behind a new connection',
  timeoutSeconds: 10,
  handler: async ({ accessToken }: IdentifyAccountPayload): Promise<IdentifyAccountResult> => {
    const self = await readAttioSelf(accessToken);
    return { externalAccountId: self.workspaceId, handle: self.workspaceName ?? `Attio workspace ${self.workspaceId}` };
  },
});
