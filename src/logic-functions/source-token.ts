import { timingSafeEqual } from 'node:crypto';

import { defineLogicFunction } from 'twenty-sdk/define';
import { kv, Response } from 'twenty-sdk/logic-function';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { SOURCE_TOKEN_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SOURCE_SECRET_HEADER, SOURCE_TOKEN_ROUTE } from 'src/shuttio-api/contract';
import { findHubspotConnection, readHubspotTokenInfo } from 'src/shuttio-api/hubspot';
import { SOURCE_SECRET_KV_KEY } from 'src/shuttio-api/proxy';

const sameSecret = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Shuttio calls this with its Twenty OAuth token to read the workspace's HubSpot
// token on demand; Shuttio stores no HubSpot token of its own.
//
// Twenty authenticates the caller but does not tell the function which OAuth client
// issued the token, so any member token or API key of this workspace passes that
// check. The secret header narrows it to Shuttio: the proxy generated the secret,
// keeps it in the app's key-value store and sent it only to Shuttio.
export default defineLogicFunction({
  universalIdentifier: SOURCE_TOKEN_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'source-token',
  description: "Returns the workspace HubSpot access token to Shuttio",
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: SOURCE_TOKEN_ROUTE,
    httpMethod: 'GET',
    isAuthRequired: true,
    forwardedRequestHeaders: [SOURCE_SECRET_HEADER],
  },
  handler: async (event: RoutePayload) => {
    const expected = await kv.get<string>(SOURCE_SECRET_KV_KEY);
    const given = event.headers[SOURCE_SECRET_HEADER];
    if (typeof expected !== 'string' || typeof given !== 'string' || !sameSecret(given, expected)) {
      return new Response({ code: 'forbidden', message: 'Missing or wrong source secret.' }, { status: 403 });
    }

    if (event.queryStringParameters.provider !== 'hubspot') {
      return new Response({ code: 'bad_provider', message: 'Only provider=hubspot is supported.' }, { status: 400 });
    }

    const { usable, failed } = await findHubspotConnection();
    if (!usable) {
      return new Response(
        {
          code: failed ? 'reconnect_required' : 'not_connected',
          message: failed
            ? 'The HubSpot connection in Twenty needs a reconnect.'
            : 'This workspace has no HubSpot connection.',
        },
        { status: 409 },
      );
    }

    let expiresAt: string | null = null;
    let hubId: number | null = null;
    try {
      const info = await readHubspotTokenInfo(usable.accessToken);
      hubId = info.hubId;
      if (info.expiresInSeconds !== null) {
        expiresAt = new Date(Date.now() + info.expiresInSeconds * 1000).toISOString();
      }
    } catch {
      // The token itself is still the best answer; Shuttio asks again on a 401.
    }

    return new Response(
      { accessToken: usable.accessToken, expiresAt, hubId, scopes: usable.scopes },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  },
});
