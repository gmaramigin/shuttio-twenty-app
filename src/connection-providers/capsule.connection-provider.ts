import { defineConnectionProvider } from 'twenty-sdk/define';

import {
  CAPSULE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  CAPSULE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One shared Capsule connection per workspace. Shuttio reads its token through the
// source-token route when it needs one; Twenty keeps it and refreshes it (Capsule access
// tokens live about 7 days). Read scope only: Twenty is the destination, Capsule is read.
// Capsule checks redirect_uri against the application's, so this is a Capsule application
// of its own, registered with Twenty's callback.
export default defineConnectionProvider({
  universalIdentifier: CAPSULE_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'capsule',
  displayName: 'Capsule',
  logo: 'public/capsule.png',
  type: 'oauth',
  scope: 'WORKSPACE',
  oauth: {
    authorizationEndpoint: 'https://api.capsulecrm.com/oauth/authorise',
    tokenEndpoint: 'https://api.capsulecrm.com/oauth/token',
    scopes: ['read'],
    clientIdVariable: 'CAPSULE_CLIENT_ID',
    clientSecretVariable: 'CAPSULE_CLIENT_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    usePkce: false,
  },
  identifyAccountLogicFunction: {
    universalIdentifier: CAPSULE_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  },
});
