import { defineConnectionProvider } from 'twenty-sdk/define';

import {
  ATTIO_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  ATTIO_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One shared Attio connection per workspace. Shuttio reads its token through the
// source-token route when it needs one; Twenty keeps it.
// Attio fixes an app's scopes when the app is registered; the authorize URL carries none
// (Shuttio's own Attio connect sends none either). Attio tokens do not expire.
export default defineConnectionProvider({
  universalIdentifier: ATTIO_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'attio',
  displayName: 'Attio',
  logo: 'public/attio.png',
  type: 'oauth',
  scope: 'WORKSPACE',
  oauth: {
    authorizationEndpoint: 'https://app.attio.com/authorize',
    tokenEndpoint: 'https://app.attio.com/oauth/token',
    scopes: [],
    clientIdVariable: 'ATTIO_CLIENT_ID',
    clientSecretVariable: 'ATTIO_CLIENT_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    usePkce: false,
  },
  identifyAccountLogicFunction: {
    universalIdentifier: ATTIO_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  },
});
