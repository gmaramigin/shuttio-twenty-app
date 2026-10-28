# Setup

Follow these steps to get your app running locally.

## Prerequisites

- Node.js (version specified in `.nvmrc`)
- Yarn 4
- Docker (to run the local Twenty server)

## Steps

1. Install dependencies:

   ```bash
   yarn install
   ```

   The committed `yarn.lock` pins exact, integrity-checked versions, so this
   resolves nothing from the registry.

2. Start the local Twenty server:

   ```bash
   yarn twenty docker:start
   ```

   Check the server status at any time with `yarn twenty docker:status`.

3. Start the development server and sync your app:

   ```bash
   yarn twenty dev
   ```

4. Open [http://localhost:2020](http://localhost:2020) and log in with the default development credentials: `tim@apple.dev` / `tim@apple.dev`.

## Verifying your setup

- `yarn lint` - Lint the project with oxlint
- `yarn typecheck` - Type-check the project
- `yarn test:unit` - Run unit tests
- `yarn test` - Run integration tests

## The Shuttio API

The page talks to Shuttio only through the app's logic functions. Paths, request bodies and response types live in `src/shuttio-api/contract.ts`; the Shuttio side documents the same contract in `docs/twenty-app-api.md` of the Shuttio repo. Change both together.

## Troubleshooting

See the [troubleshooting guide](https://docs.twenty.com/developers/extend/apps/getting-started/troubleshooting) or ask on [Discord](https://discord.gg/cx5n4Jzs57).

## Publishing to npm

`.github/workflows/publish.yml` publishes the package to npm with provenance when a `v*` tag is pushed. Provenance is what lets the owner claim the app in Twenty with **Claim with GitHub**, so publish only from this public repository through GitHub Actions.

**Trusted publishing (default, no secret):**

1. On npmjs.com, open the `twenty-app-shuttio` package, then Settings, then Trusted Publisher. Choose GitHub Actions, repository `gmaramigin/shuttio-twenty-app`, workflow `publish.yml`.
2. Bump `version` in `package.json`, commit, then `git tag v1.0.1 && git push origin main --tags`.

**Fallback, NPM_TOKEN secret:** npm only lets you add a trusted publisher to a package that already exists. For the very first release, or if OIDC fails:

1. On npmjs.com create a granular access token with read and write access to packages (for the first publish, scope it to all packages; afterwards, to `twenty-app-shuttio` only).
2. Add it to this repository as the Actions secret `NPM_TOKEN` (Settings, Secrets and variables, Actions).
3. Push the tag. The workflow passes the secret as `NODE_AUTH_TOKEN`; provenance still comes from GitHub Actions.
4. After trusted publishing works, delete the secret and the token.

## Claiming the app in Twenty

1. Wait for the marketplace catalog to pick up the package (the `twenty-app` keyword is set).
2. In Twenty, open Settings, Developers, Apps, enter `twenty-app-shuttio` under **Claim an application**, click **Look up**, then **Claim with GitHub** as the GitHub owner of this repository.
