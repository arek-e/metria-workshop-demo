# Metria AI Quality Workbench

Nx monorepo for an Angular/GIS workbench and a Fastify API. The application models a
geodata decision-support workflow with production-style agent context, tests, and quality gates.

## Workspace Layout

```text
apps/web      Angular 20 standalone map application
apps/api      Fastify + GraphQL API service
apps/web-e2e  Cypress end-to-end suite for the web app
```

## Quick Start

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4200` and sign in through Keycloak. The local API listens on
`http://127.0.0.1:3000`.

`npm run dev` starts the local Docker services first, waits for application Postgres, applies
Drizzle migrations, seeds geodata, waits for the imported Keycloak realm, seeds the demo realm
data through the Keycloak Admin API, and then starts the Fastify API and Angular through Nx.

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

Drizzle owns the application database schema and migrations:

```text
drizzle.config.ts                 Drizzle Kit config
apps/api/src/db/schema.ts         TypeScript schema
apps/api/drizzle/                 Generated SQL migrations
apps/api/src/db/migrate.ts        Migration runner
apps/api/src/db/seed.ts           Geodata seed runner
```

## API

The Fastify app lives in `apps/api`.

```sh
npm run dev:api      # Start Fastify on http://127.0.0.1:3000
nx run api:test      # Run API contract tests
nx run api:build     # Compile API output to dist/apps/api
```

Available local endpoints:

```text
GET /health
GET /api/status
POST /graphql
GET /graphiql  # Development GraphQL IDE
```

GraphQL owns the workbench data boundary. The current schema exposes `status`,
`mapWorkbench`, and `searchTargets(query:, limit:)`. The Angular app loads map layer metadata,
default selected layers, searchable targets, and vector geometry through this API. Runtime
resolvers read through the Drizzle-backed geodata repository; tests inject an in-memory
repository at the same interface.

In development, browser visits to `/graphql` redirect to `/graphiql`. API clients should still
send GraphQL operations to `/graphql`.

Runtime configuration:

```text
API_HOST=127.0.0.1
API_PORT=3000
API_CORS_ORIGIN=true
```

Useful service commands:

```sh
npm run services       # Start app Postgres, migrate/seed geodata, start/seed Keycloak
npm run db:status      # Check application Postgres readiness
npm run db:wait        # Wait for application Postgres to accept connections
npm run db:generate    # Generate a Drizzle migration from apps/api/src/db/schema.ts
npm run db:migrate     # Apply Drizzle migrations to the application database
npm run db:seed        # Seed geodata rows used by the workbench
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
npm run dev           # Start local services, Fastify API, and Angular
npm run dev:web       # Start local services and Angular only
npm run dev:api       # Start Fastify API only
npm run services      # Start services, migrate/seed geodata, and seed auth data
npm run db:status     # Check application Postgres readiness
npm run db:wait       # Wait for application Postgres to accept connections
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Apply Drizzle migrations
npm run db:seed       # Seed workbench geodata
npm run db:shell      # Open psql against the application database
npm run services:seed # Re-apply Keycloak demo seed data
npm run services:down # Stop local Docker services
npm run build         # Production build for Angular and API
npm run lint          # ESLint
npm run storybook     # Storybook
npm run e2e           # Builds web, starts API + static web server, and runs Cypress through Nx
npm run quality       # Format check, lint, tests, build, and Cypress e2e
npm run keycloak:up   # Alias for npm run services
npm run keycloak:down # Alias for npm run services:down
npx nx show projects  # List Nx projects
```

## Feature Slice

The active feature is a layer decision-support panel:

- map layer metadata
- restricted geodata access
- stable map render order

The main public behavior lives in:

```text
apps/web/src/app/map-workbench/layers/layer-access-policy.ts
apps/web/src/app/map-workbench/workbench-data/map-workbench-api.ts
apps/api/src/domains/geodata/
apps/api/src/db/schema.ts
```

The tests show the workshop's preferred TDD style:

```text
apps/web/src/app/map-workbench/layers/layer-access-policy.spec.ts
apps/web/src/app/map-workbench/workbench-data/map-workbench-api.spec.ts
apps/api/src/server.spec.ts
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

Runtime dependencies are intentionally limited to what the current implementation imports:
Angular, Angular Material/CDK, OpenLayers, Keycloak, Fastify, Mercurius/GraphQL,
Drizzle/Postgres, local fonts/icons, RxJS, and runtime helpers. Add GIS analysis, export,
realtime, chart, or grid libraries only with the vertical feature that uses them.
