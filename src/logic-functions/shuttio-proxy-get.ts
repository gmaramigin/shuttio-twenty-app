import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { PROXY_GET_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { PROXY_ROUTE_PATTERN } from 'src/shuttio-api/contract';
import { proxyToShuttio } from 'src/shuttio-api/proxy';

export default defineLogicFunction({
  universalIdentifier: PROXY_GET_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'shuttio-proxy-get',
  description: 'Forwards GET calls from the import page to the Shuttio API as the signed-in member',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PROXY_ROUTE_PATTERN,
    httpMethod: 'GET',
    isAuthRequired: true,
  },
  handler: (event: RoutePayload) => proxyToShuttio('GET', event),
});
