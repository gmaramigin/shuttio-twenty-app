import { defineConnectionProvider } from 'twenty-sdk/define';

import {
  CLOZE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  CLOZE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One shared Cloze connection per workspace. Shuttio reads its token through the
// source-token route when it needs one; Twenty keeps it and refreshes it.
// Source scopes only (Shuttio's cloze-scopes.ts, CLOZE_SOURCE_SCOPES): Twenty is the
// destination, Cloze is read. Shuttio's Cloze app lists Twenty's callback as a redirect URL.
export default defineConnectionProvider({
  universalIdentifier: CLOZE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'cloze',
  displayName: 'Cloze',
  logo: 'public/cloze.png',
  type: 'oauth',
  scope: 'WORKSPACE',
  oauth: {
    authorizationEndpoint: 'https://www.cloze.com/oauth/authorize',
    tokenEndpoint: 'https://www.cloze.com/oauth/token',
    scopes: ['basic', 'read_relation', 'read_content'],
    clientIdVariable: 'CLOZE_CLIENT_ID',
    clientSecretVariable: 'CLOZE_CLIENT_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    usePkce: false,
  },
  identifyAccountLogicFunction: {
    universalIdentifier: CLOZE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  },
});
