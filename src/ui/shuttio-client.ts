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
    return { ok: false, status: 0, ...describeFailure(0, null) };
  }
};

const proxyPath = (path: string) => `/s${PROXY_ROUTE_PREFIX}/${path}`;

export const shuttio = {
  get: <T>(path: string) => run<T>((client) => client.get(proxyPath(path))),
  post: <T>(path: string, body: unknown = {}) =>
    run<T>((client) => client.post(proxyPath(path), body)),
  put: <T>(path: string, body: unknown) =>
    run<T>((client) => client.put(proxyPath(path), body)),
};

export const getSourceStatus = <T>(provider: SourceProvider) =>
  run<T>((client) => client.get(`/s${SOURCE_STATUS_ROUTE}?provider=${provider}`));
