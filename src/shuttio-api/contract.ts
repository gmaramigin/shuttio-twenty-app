// The Shuttio API this app talks to: base path, route names and response shapes.
// Source of truth: docs/twenty-app-api.md in the Shuttio repo (branch twenty-app-api).
// Everything that depends on that contract lives in this file, so a change there is
// one edit here.

export const SHUTTIO_DEFAULT_BASE_URL = 'https://www.shuttio.com';
export const SHUTTIO_API_PREFIX = '/api/twenty-app/v1';

// App routes (logic functions). The page calls them through RestApiClient with a
// `/s` prefix; Shuttio calls SOURCE_TOKEN_ROUTE on the workspace's functions URL.
export const PROXY_ROUTE_PREFIX = '/shuttio/api';
export const PROXY_ROUTE_PATTERN = `${PROXY_ROUTE_PREFIX}/*path`;
export const SOURCE_TOKEN_ROUTE = '/shuttio/source-token';
// `?provider=hubspot|attio|pipedrive`; the route kept its 2.0.0 name.
export const SOURCE_STATUS_ROUTE = '/shuttio/hubspot-status';

// Header Shuttio sends back when it asks for a source token. The value is the
// secret the proxy handed over in `POST migrations/:id/source`.
export const SOURCE_SECRET_HEADER = 'x-shuttio-source-secret';
// Header the proxy adds so Shuttio knows which Twenty API validates the token.
export const TWENTY_API_URL_HEADER = 'x-twenty-api-url';

export type SourceProvider = 'hubspot' | 'attio' | 'pipedrive';

export const SOURCE_PROVIDERS: readonly SourceProvider[] = ['hubspot', 'attio', 'pipedrive'];

export const SOURCE_LABELS: Record<SourceProvider, string> = {
  hubspot: 'HubSpot',
  attio: 'Attio',
  pipedrive: 'Pipedrive',
};

export const isSourceProvider = (value: unknown): value is SourceProvider =>
  typeof value === 'string' && (SOURCE_PROVIDERS as readonly string[]).includes(value);


export type MigrationSummary = {
  id: string;
  source: string;
  status: MigrationStatus;
  createdAt: string;
};

// `GET status`. A workspace not linked to a Shuttio account answers 409
// `{ code: 'link_required', linkUrl }` instead.
export type StatusResponse = {
  linked: boolean;
  linkUrl?: string;
  account?: { email: string };
  migrations: MigrationSummary[];
};

export type LinkRequiredError = { code: 'link_required'; linkUrl: string };

export type CreateMigrationResponse = { id: string };

// `POST migrations/:id/source` body. The proxy fills functionsUrl and
// sourceTokenSecret itself; the page sends only the provider.
export type ConnectSourceRequest = {
  provider: SourceProvider;
  functionsUrl: string;
  sourceTokenSecret: string;
};

export type FieldTarget = string | null; // destination field name, 'new', or null = skip

export type DestinationField = { name: string; label: string; type: string };

export type SourceField = {
  name: string;
  label: string;
  type: string;
  samples?: string[];
  empty?: boolean;
};

export type MappingObject = {
  sourceObject: string;
  label: string;
  destinationObject: string;
  destinationLabel: string;
  included: boolean;
  recordCount?: number | null;
  sourceFields: SourceField[];
  destinationFields: DestinationField[];
  // source field name -> target
  mapping: Record<string, FieldTarget>;
  // Why the object cannot be moved or read, else null.
  note?: string | null;
};

// `GET migrations/:id/mapping`
export type MappingResponse = { objects: MappingObject[] };

// `PUT migrations/:id/mapping`
export type SaveMappingRequest = {
  objects: {
    sourceObject: string;
    included: boolean;
    mapping: Record<string, FieldTarget>;
  }[];
};

export type MigrationStatus =
  | 'setup'
  | 'sample_running'
  | 'sample_done'
  | 'running'
  | 'done'
  | 'failed'
  | 'paused'
  | 'rolling_back'
  | 'rolled_back';

export type ObjectProgress = {
  name: string;
  label: string;
  total: number | null;
  done: number;
  failed: number;
  status: string;
};

// `url` is absolute, or a path inside Twenty such as /object/person/<id>.
export type RecordLink = { label: string; url: string };

// Why `price` is what it is.
export type PriceOffer = 'counting' | 'count_failed' | 'free' | 'paid' | 'custom' | 'unconfigured';

// `GET migrations/:id`
export type MigrationDetail = {
  id: string;
  source: string;
  status: MigrationStatus;
  sourceConnected: boolean;
  mappingSaved: boolean;
  isSample: boolean;
  paid: boolean;
  price?: { amountUsd: number; recordCount: number | null } | null;
  objects: ObjectProgress[];
  errors: { object: string; message: string; count: number }[];
  links: RecordLink[];
  resultsUrl?: string;
  offer?: PriceOffer;
  error?: string | null;
};

// `url` is null when nothing is owed: Shuttio then starts the full run itself.
export type CheckoutResponse = { url: string | null; started?: boolean };

export const isRunning = (status: MigrationStatus) =>
  status === 'sample_running' || status === 'running' || status === 'rolling_back';

// Path segments the proxy forwards. Anything else is refused before it leaves Twenty.
export const ALLOWED_PROXY_PATHS: { method: 'GET' | 'POST' | 'PUT'; pattern: RegExp }[] = [
  { method: 'GET', pattern: /^status$/ },
  { method: 'POST', pattern: /^migrations$/ },
  { method: 'GET', pattern: /^migrations\/[A-Za-z0-9_-]{1,64}$/ },
  { method: 'GET', pattern: /^migrations\/[A-Za-z0-9_-]{1,64}\/mapping$/ },
  { method: 'PUT', pattern: /^migrations\/[A-Za-z0-9_-]{1,64}\/mapping$/ },
  {
    method: 'POST',
    pattern: /^migrations\/[A-Za-z0-9_-]{1,64}\/(source|sample|checkout|run|rollback)$/,
  },
];
