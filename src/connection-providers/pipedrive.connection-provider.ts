import { defineConnectionProvider } from 'twenty-sdk/define';

import {
  PIPEDRIVE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  PIPEDRIVE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One shared Pipedrive connection per workspace. Shuttio reads its token through the
// source-token route when it needs one; Twenty keeps it.
// Pipedrive fixes an app's scopes when the app is registered; the authorize URL carries none
// (Shuttio's own Pipedrive connect sends none either). Pipedrive allows one callback URL per
// app, so this is its own Pipedrive app, registered with Twenty's callback and read scopes.
export default defineConnectionProvider({
  universalIdentifier: PIPEDRIVE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'pipedrive',
  displayName: 'Pipedrive',
  logo: 'public/pipedrive.png',
  type: 'oauth',
  scope: 'WORKSPACE',
  oauth: {
    authorizationEndpoint: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenEndpoint: 'https://oauth.pipedrive.com/oauth/token',
    scopes: [],
    clientIdVariable: 'PIPEDRIVE_CLIENT_ID',
    clientSecretVariable: 'PIPEDRIVE_CLIENT_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    usePkce: false,
  },
  identifyAccountLogicFunction: {
    universalIdentifier: PIPEDRIVE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  },
});
