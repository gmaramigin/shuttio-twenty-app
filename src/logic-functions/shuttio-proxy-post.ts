import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { PROXY_POST_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PROXY_ROUTE_PATTERN } from 'src/shuttio-api/contract';
import { proxyToShuttio } from 'src/shuttio-api/proxy';

export default defineLogicFunction({
  universalIdentifier: PROXY_POST_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'shuttio-proxy-post',
  description: 'Forwards POST calls from the import page to the Shuttio API as the signed-in member',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PROXY_ROUTE_PATTERN,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler: (event: RoutePayload) => proxyToShuttio('POST', event),
});
