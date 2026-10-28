import { defineConnectionProvider } from 'twenty-sdk/define';

import { HUBSPOT_OPTIONAL_SCOPES, HUBSPOT_REQUIRED_SCOPES } from 'src/constants/hubspot-scopes';
import {
  HUBSPOT_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  HUBSPOT_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One shared HubSpot connection per workspace. Shuttio reads its token through the
// source-token route when it needs one; Twenty refreshes it.
export default defineConnectionProvider({
  universalIdentifier: HUBSPOT_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'hubspot',
  displayName: 'HubSpot',
  logo: 'public/hubspot.png',
  type: 'oauth',
  scope: 'WORKSPACE',
  oauth: {
    authorizationEndpoint: 'https://app.hubspot.com/oauth/authorize',
    tokenEndpoint: 'https://api.hubapi.com/oauth/v1/token',
    scopes: HUBSPOT_REQUIRED_SCOPES,
    authorizationParams: { optional_scope: HUBSPOT_OPTIONAL_SCOPES.join(' ') },
    clientIdVariable: 'HUBSPOT_CLIENT_ID',
    clientSecretVariable: 'HUBSPOT_CLIENT_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    // HubSpot's OAuth docs describe no PKCE; the client secret authenticates the exchange.
    usePkce: false,
  },
  identifyAccountLogicFunction: {
    universalIdentifier: HUBSPOT_IDENTIFY_ACCOUNT_FUNCTION_UNIVERSAL_IDENTIFIER,
  },
});
