# Metria Map App - Agent Instructions

This repo is a production-style Angular geodata map application. Treat it as a real
map product for searching Swedish places and properties, inspecting geodata layers,
handling restricted map data, and preparing decision-support exports.

## Repo Map

- `apps/web/src/app/` - Angular 20 standalone map app and package-level `AGENTS.md`.
- `apps/web/src/app/app.ts` - thin root component that renders the map workbench feature.
- `apps/web/src/app/map-workbench/` - OpenLayers map setup, search flow, auth-aware layer state, account control, layer controls, and responsive overlay styling.
- `apps/web/src/app/map-workbench/layers/` - domain module for layer access, selected state, and stable render ordering.
- `apps/web/src/app/map-workbench/search/` - search target models and selected-coordinate formatting.
- `apps/web/src/app/map-workbench/workbench-data/` - GraphQL-backed frontend data adapter for workbench catalog/search/geometry.
- `apps/web/src/app/auth/` - Keycloak/OIDC integration and role mapping.
- `apps/web/src/app/shared/` - cross-feature API and authorization contracts.
- `apps/api/src/domains/geodata/` - Fastify/Mercurius GraphQL domain for workbench catalog, search targets, and map feature geometry.
- `apps/api/src/domains/system/` - system status contract shared by REST health and GraphQL status.
- `apps/web-e2e/` - Cypress tests for map search, layer selection, responsive overlay behavior, and current account UI.
- `docker/keycloak/` and `scripts/` - local Keycloak realm and seed tooling.
- `.agents/docs/` - deeper docs loaded on demand; start with `.agents/docs/index.md`.
- `.agents/commands/` - reusable project workflow prompts.

## Key Commands

```sh
npm start              # Angular dev server on http://localhost:4200
npm run dev            # Services + Fastify API + Angular
npm run dev:api        # Fastify API on http://127.0.0.1:3000
npm run services       # Start and seed local Keycloak/Postgres services
npm test               # Vitest tests
npm run test:watch     # Vitest watch mode
npm run build          # Production build
npm run lint           # ESLint
npm run format:check   # Prettier check
npm run storybook      # Storybook on http://localhost:6006
npm run e2e            # Builds web, starts API + static web server, runs Cypress, then stops them
npm run quality        # Format, lint, tests, build, Cypress
```

## Stack

- Core UI: Angular 20 standalone components, Angular Material/CDK, Tailwind CSS, local Inter font, Material Symbols.
- Map/GIS: OpenLayers (`ol`) for map rendering, `fromLonLat`/projection handling, vector features, tile layers, and map controls.
- Data/state: Angular signals/computed values and RxJS for service state.
- Auth: Keycloak, `keycloak-js`, role mapping into app-level geodata permissions.
- API: Fastify with explicit health/status endpoints and Mercurius GraphQL at `/graphql`.
- Quality: Vitest, Cypress, Storybook, ESLint, Prettier, Husky, semantic-release.

## Product Rules

1. Keep the first screen map-first. Search and layer controls should be overlays on the map, not a landing page.
2. Current core behavior is place/property search plus layer selection. Do not reintroduce planning-line selection unless the user explicitly asks for it.
3. OpenLayers is the map rendering boundary. Use OpenLayers APIs for map state, view movement, layers, vector sources, styles, and controls.
4. Treat geospatial correctness as product behavior: coordinate display, layer availability, and render order matter.
5. Restricted geodata must be role-gated through public auth/authorization seams. Do not bypass role checks in UI or tests.
6. Keep the overlay bounded and responsive. The panel may scroll internally, but the page should not overflow on the x-axis or y-axis.
7. Use Swedish product copy for visible app UI unless the surrounding feature already uses English.
8. Use product copy that describes the user task directly.

## Agent Workflow

1. Start from current code, tests, and visible product behavior.
2. If behavior is ambiguous, state the uncertainty in the working notes or ask for a concrete product decision.
3. Plan and implement work as tracer-bullet vertical slices, not horizontal layers.
   A slice should deliver one narrow behavior end-to-end through every layer it needs
   to touch: domain policy, data/auth seams, Fastify API if needed, Angular UI,
   OpenLayers rendering, and tests.
4. Avoid plans like "build all schema/state, then all services, then all UI, then tests."
   Prefer demoable steps such as "an authenticated user can select one restricted layer
   and see the gated UI state," with the smallest code path needed to verify it.
5. For each slice, write one failing public-behavior test, implement the minimum needed
   to pass it, run the relevant verification, then expand to the next slice.
6. Test through public interfaces only. Do not test private methods or internal RxJS chains.
7. Prefer deep modules for map/domain logic: small public API, richer internal behavior.
8. Keep Angular components focused on rendering, OpenLayers orchestration, and delegating policy decisions.
9. Refactor only after tests are green.
10. After changing architecture, commands, workflows, or conventions, update `.agents/docs/`.

## Domain Dictionary

| Term               | Meaning                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Map view           | OpenLayers `View` state: center, zoom, projection assumptions, and animation.    |
| Search target      | A property, address, place, or planning area that can move the map context.      |
| Decision layer     | A map layer that can be selected for property or place decision support.         |
| Restricted geodata | Layer data requiring an elevated role before selection/export.                   |

## Testing Rules

- Good tests read like specifications and exercise public behavior.
- Prefer real geometry/projection functions over mocks when correctness depends on them.
- Mock network/auth boundaries only at explicit public seams.
- Cypress covers critical journeys: map search, layer toggles, restricted-layer disabled state, account UI, and responsive overlay fit.
- Vitest covers domain policy and component behavior.
- Storybook documents UI states; it is not a replacement for assertions.
- Use the seeded local Keycloak realm when adding authenticated E2E journeys. Keep no-auth smoke coverage runnable through `npm run e2e`.

## Documentation

All deep documentation is indexed in `.agents/docs/index.md`.

At session start, consult the index when the task needs more context than this file.
After significant changes, update the relevant deep doc and the index if a new doc was added.
