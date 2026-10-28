import { kv, Response } from 'twenty-sdk/logic-function';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import {
  ALLOWED_PROXY_PATHS,
  isSourceProvider,
  SHUTTIO_API_PREFIX,
  SHUTTIO_DEFAULT_BASE_URL,
  TWENTY_API_URL_HEADER,
} from 'src/shuttio-api/contract';

type Method = 'GET' | 'POST' | 'PUT';

export const SOURCE_SECRET_KV_KEY = 'shuttio-source-token-secret';

// SHUTTIO_BASE_URL is a workspace-editable variable. The user's Twenty token rides
// on every proxied call, so only Shuttio hosts may receive it.
export const resolveShuttioBaseUrl = (value: string | undefined): string | null => {
  const raw = (value ?? '').trim() || SHUTTIO_DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const isShuttio =
    url.protocol === 'https:' && (host === 'shuttio.com' || host.endsWith('.shuttio.com'));
  const isLocal = url.protocol === 'http:' && host === 'localhost';
  if (!isShuttio && !isLocal) return null;
  return `${url.protocol}//${url.host}`;
};

// Twenty hands a `*path` wildcard to the function as one string with the segments
// joined by commas ("migrations,abc,mapping"), not as an array (seen on Twenty
// Cloud, 2026-10-27). Accept both, and a slash-joined string too.
export const pathFromParameters = (
  parameters: Record<string, string | string[] | undefined>,
): string | null => {
  const value = parameters.path;
  const segments = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,/]/)
      : [];
  if (segments.length === 0) return null;
  if (segments.some((segment) => !/^[A-Za-z0-9_-]{1,64}$/.test(segment))) return null;
  return segments.join('/');
};

export const isAllowedPath = (method: Method, path: string) =>
  ALLOWED_PROXY_PATHS.some((entry) => entry.method === method && entry.pattern.test(path));

const randomSecret = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
};

// One secret per workspace, kept in the app's key-value store. Shuttio gets it when
// a source is attached and must send it back to read the source token.
export const getOrCreateSourceSecret = async (): Promise<string> => {
  const existing = await kv.get<string>(SOURCE_SECRET_KV_KEY);
  if (typeof existing === 'string' && existing.length >= 32) return existing;
  const secret = randomSecret();
  await kv.set(SOURCE_SECRET_KV_KEY, secret);
  return secret;
};

const errorResponse = (status: number, code: string, message: string) =>
  new Response({ code, message }, { status });

export const proxyToShuttio = async (method: Method, event: RoutePayload) => {
  const path = pathFromParameters(event.pathParameters as Record<string, string | string[] | undefined>);
  if (!path || !isAllowedPath(method, path)) {
    return errorResponse(404, 'not_found', 'Unknown Shuttio route.');
  }

  const baseUrl = resolveShuttioBaseUrl(process.env.SHUTTIO_BASE_URL);
  if (!baseUrl) {
    return errorResponse(500, 'bad_base_url', 'SHUTTIO_BASE_URL must be an https://*.shuttio.com address.');
  }

  const token = process.env.TWENTY_APP_ACCESS_TOKEN;
  const apiUrl = process.env.TWENTY_API_URL;
  if (!token || !apiUrl) {
    return errorResponse(401, 'no_session', 'Twenty did not pass a session to the app. Reload the page.');
  }

  let body: unknown = method === 'GET' ? undefined : (event.body ?? {});

  // The page never chooses where Shuttio fetches the source token: the proxy fills
  // in this workspace's functions URL and the shared secret.
  if (method === 'POST' && path.endsWith('/source')) {
    const functionsUrl = process.env.TWENTY_FUNCTIONS_URL || `${apiUrl}/s`;
    const provider = (body as { provider?: unknown }).provider;
    if (!isSourceProvider(provider)) {
      return errorResponse(400, 'bad_provider', 'The source must be HubSpot, Attio or Pipedrive.');
    }
    body = { provider, functionsUrl, sourceTokenSecret: await getOrCreateSourceSecret() };
  }

  const url = new URL(`${baseUrl}${SHUTTIO_API_PREFIX}/${path}`);
  for (const [key, value] of Object.entries(event.queryStringParameters ?? {})) {
    if (typeof value === 'string') url.searchParams.set(key, value);
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        [TWENTY_API_URL_HEADER]: apiUrl,
        accept: 'application/json',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return errorResponse(502, 'unreachable', 'Shuttio did not answer. Try again in a minute.');
  }

  const text = await upstream.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { code: 'bad_response', message: `Shuttio answered ${upstream.status} without JSON.` };
  }
  return new Response(parsed, { status: upstream.status });
};
