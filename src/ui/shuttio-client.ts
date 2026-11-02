import { RestApiClient, RestApiClientError } from 'twenty-client-sdk/rest';

import { PROXY_ROUTE_PREFIX, SOURCE_STATUS_ROUTE } from 'src/shuttio-api/contract';
import type { SourceProvider } from 'src/shuttio-api/contract';

export type CallResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string; linkUrl?: string };

const describeFailure = (status: number, body: unknown) => {
  const record = (body && typeof body === 'object' ? body : {}) as {
    code?: unknown;
    message?: unknown;
    error?: unknown;
    linkUrl?: unknown;
  };
  const code = typeof record.code === 'string' ? record.code : `http_${status}`;
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : status === 0
          ? 'The request did not reach Twenty. Check the connection and try again.'
          : `The request failed (${status}).`;
  const linkUrl = typeof record.linkUrl === 'string' ? record.linkUrl : undefined;
  return { code, message, linkUrl };
};

const run = async <T>(send: (client: RestApiClient) => Promise<unknown>): Promise<CallResult<T>> => {
  try {
    const data = (await send(new RestApiClient())) as T;
    return { ok: true, data };
  } catch (error) {
    if (error instanceof RestApiClientError) {
      const status = error.status ?? 0;
      return { ok: false, status, ...describeFailure(status, error.body) };
    }
    // fetch itself threw (a network error, or an answer the browser refused): say what, for the console.
    console.warn('Shuttio request did not reach Twenty', error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    return { ok: false, status: 0, ...describeFailure(0, null) };
  }
};

const proxyPath = (path: string) => `/s${PROXY_ROUTE_PREFIX}/${path}`;

// A call that hangs past Twenty's 30-second function limit ends as "did not reach Twenty", so a
// click always gets an answer.
const ATTEMPT_MS = 40_000;
const timeoutSignal = (): AbortSignal | undefined =>
  typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(ATTEMPT_MS)
    : undefined;

// Failures of the way to Shuttio, not answers from it: the request threw before any answer (as on
// a cold logic function), or the proxy or a gateway gave up.
const TRANSIENT = new Set([0, 502, 503, 504]);
export const isTransient = (result: CallResult<unknown>) => !result.ok && TRANSIENT.has(result.status);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Sends the call again after each delay while it fails on the way. Only for calls Shuttio may
// receive twice: reads, the mapping save (the same body), and starts it refuses to repeat.
export const withRetry = async <T>(
  call: () => Promise<CallResult<T>>,
  delays: number[],
  wait: (ms: number) => Promise<void> = sleep,
): Promise<CallResult<T>> => {
  let result = await call();
  for (const delay of delays) {
    if (!isTransient(result)) break;
    await wait(delay);
    result = await call();
  }
  return result;
};

const READ_RETRIES = [500, 1_500];
const WRITE_RETRIES = [1_000];

export const shuttio = {
  get: <T>(path: string) =>
    withRetry(() => run<T>((client) => client.get(proxyPath(path), { signal: timeoutSignal() })), READ_RETRIES),
  // Not repeated: a repeat could make a second migration or checkout.
  post: <T>(path: string, body: unknown = {}) =>
    run<T>((client) => client.post(proxyPath(path), body, { signal: timeoutSignal() })),
  // Repeated on the way failures: Shuttio refuses a second sample, run or rollback of one migration.
  postRepeatable: <T>(path: string, body: unknown = {}) =>
    withRetry(() => run<T>((client) => client.post(proxyPath(path), body, { signal: timeoutSignal() })), WRITE_RETRIES),
  put: <T>(path: string, body: unknown) =>
    withRetry(() => run<T>((client) => client.put(proxyPath(path), body, { signal: timeoutSignal() })), WRITE_RETRIES),
};

export const getSourceStatus = <T>(provider: SourceProvider) =>
  withRetry(
    () => run<T>((client) => client.get(`/s${SOURCE_STATUS_ROUTE}?provider=${provider}`, { signal: timeoutSignal() })),
    READ_RETRIES,
  );
