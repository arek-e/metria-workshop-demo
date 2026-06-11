# Metria AI Quality Workbench

Angular/GIS workbench for AI-assisted software development, spec-driven development,
TDD, and AI-driven quality. The application models a geodata decision-support
workflow with production-style agent context, tests, and quality gates.

## Quick Start

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4200` and sign in through Keycloak.

`npm run dev` starts the local Docker services first, waits for the imported Keycloak realm,
seeds the demo realm data through the Keycloak Admin API, and then starts Angular.

Demo credentials:

```text
username: demo
password: demo
```

## Login And Seed

1. Start Docker Desktop or OrbStack.
2. Run `npm run dev`.
3. Open `http://127.0.0.1:4200`.
4. When redirected to Keycloak, use `demo` / `demo`.
5. After login, the app header should show `Metria Demo`.

The seed data lives in `docker/keycloak/metria-demo-realm.json` and is applied in two ways:

- Keycloak imports the realm file on a clean database startup.
- `npm run services:seed` runs `scripts/seed-keycloak.mjs` to idempotently create/update the
  realm, roles, public Angular client, demo user, password, and role mappings.

The seeded `demo` user has these application roles:

```text
case-worker
exporter
restricted-geodata
```

The local Keycloak admin console is available at `http://127.0.0.1:8080/admin` with
`admin` / `admin`. The imported realm is `metria-demo` and the Angular public client is
`metria-workbench`.

## Local Services

Docker Compose starts:

- `app-postgres` - application Postgres database for map app data, exposed on `127.0.0.1:5433`.
- `postgres` - Postgres database for Keycloak, stored in the `keycloak-postgres-data` volume.
- `keycloak` - Keycloak 26 with the `metria-demo` realm.

Application database URL:

```text
postgresql://metria:metria@127.0.0.1:5433/metria_map
```

Useful service commands:

```sh
npm run services       # Start app Postgres + Keycloak, wait, then seed auth data
npm run db:status      # Check application Postgres readiness
npm run db:shell       # Open psql against the application database
npm run services:seed  # Re-apply demo realm/user/client seed data
npm run services:down  # Stop services; keeps Postgres volumes
```

To inspect the application database:

```sh
docker compose exec app-postgres psql -U metria -d metria_map
```

To inspect the Keycloak database:

```sh
docker compose exec postgres psql -U keycloak -d keycloak
```

## Auth Troubleshooting

If Keycloak shows this message:

```text
Restart login cookie not found.
```

the browser is on an expired one-time Keycloak login action URL. Do not refresh or resubmit that
`/login-actions/authenticate?...session_code=...` page. Open `http://localhost:4200` again, let the
app start a fresh redirect to Keycloak, then sign in with `demo` / `demo`.

If it still repeats, clear cookies for `127.0.0.1:8080` and `localhost:8080`, then open
`http://localhost:4200` again.

## Commands

```sh
npm test              # Vitest behavior tests
npm run test:watch    # Vitest watch mode
npm run dev           # Start local services, wait for readiness, then start Angular
npm run services      # Start local Docker services and seed auth data
npm run db:status     # Check application Postgres readiness
npm run db:shell      # Open psql against the application database
npm run services:seed # Re-apply Keycloak demo seed data
npm run services:down # Stop local Docker services
npm run build         # Angular production build
npm run lint          # ESLint
npm run storybook     # Storybook
npm run e2e           # Cypress; requires npm start in another terminal
npm run quality       # Format check, lint, tests, build
npm run keycloak:up   # Alias for npm run services
npm run keycloak:down # Alias for npm run services:down
```

## Feature Slice

The active feature is a layer decision-support panel:

- map layer metadata
- restricted geodata access
- projection warnings
- stable map render order
- export readiness
- locale-aware quality metadata

The main public behavior lives in:

```text
src/app/layer-decision-support/layer-access-policy.ts
```

The tests show the workshop's preferred TDD style:

```text
src/app/layer-decision-support/layer-access-policy.spec.ts
```

## Agent Context

Start with:

```text
AGENTS.md
```

Deep docs are indexed in:

```text
.agents/docs/index.md
```

The repo also includes agent command prompts in `.agents/commands/` and portable local agent
workflow assets in `.agents/` and `.specify/`.

## Dependency Notes

The package includes Metria-relevant libraries for product work: Angular Material/CDK,
Calcite, OpenLayers, proj4, turf, jsts, Apollo GraphQL, Keycloak/OIDC references, realtime
clients, chart/grid libraries, document/export libraries, Vitest, Cypress, Storybook, ESLint,
Prettier, Husky, and semantic-release.

Some optional export/document libraries may report transitive `npm audit` warnings. Agents
should surface supply-chain risk instead of hiding it.
