# Angular Map App Context

This directory contains the Angular 20 standalone map application. Treat this as a
real geospatial product surface.

## Commands

```sh
npm test -- src/app/location-search/location-search-policy.spec.ts
npm test -- src/app/layer-decision-support/layer-access-policy.spec.ts
npm test -- src/app/app.spec.ts
npm run build
```

## Structure

- `app.ts`, `app.html`, `app.scss` - map shell, OpenLayers orchestration, search UI, layer controls, auth/account UI, and responsive overlay styling.
- `app.spec.ts` - component behavior smoke test through Testing Library.
- `app.stories.ts` - Storybook states for visual review.
- `location-search/` - public search policy, local Swedish search targets, and coordinate formatting.
- `layer-decision-support/layer-access-policy.ts` - deep domain module for layer availability, selected layers, projection warnings, and export readiness.
- `layer-decision-support/layer-access-policy.spec.ts` - public-interface tests for layer policy behavior.
- `layer-decision-support/layer-catalog.fixture.ts` - deterministic seed data for map layers.
- `auth/` - Keycloak startup, login/logout, token role extraction, and app role mapping.

## Map Patterns

- Use OpenLayers APIs for map rendering and movement: `Map`, `View`, `TileLayer`, `VectorLayer`, `VectorSource`, `Feature`, geometries, and styles.
- Keep geographic state explicit. Store lon/lat inputs clearly and convert through OpenLayers projection helpers at the rendering boundary.
- Keep map controls stable across breakpoints. They must not overlap the search/layer overlay.
- Use real OpenLayers canvas/vector behavior in browser tests where possible; stub external tile requests in Cypress when the test does not depend on tile imagery.
- Do not add planning-line selection UI or line-specific map overlays unless the user asks for that feature again.

## Angular Patterns

- Use standalone components and explicit `imports`.
- Keep domain decisions outside components when possible.
- Components should render view models and delegate policy decisions to public functions/services.
- Prefer signals/computed values for local UI state.
- Keep auth side effects in `auth/`; UI should call public auth methods only.
- Do not add NgModules unless an external library requires one.

## Testing Patterns

- Search behavior: test through `findLocalSearchTarget`, coordinate formatting, and visible component outcomes.
- Layer behavior: call public functions such as `buildLayerDecisionView` and `nextSelectedLayerIds`.
- Component behavior: render with Testing Library and assert visible output/interactions.
- E2E behavior: use Cypress for search, layer toggles, restricted geodata sign-in, and viewport fit.
- Avoid private method tests and implementation call-count tests.
- Add one test at a time during TDD cycles.

## Styling

- Use Angular Material for familiar controls and menus.
- Use Tailwind for layout and spacing when it keeps the template readable.
- Keep app-specific OpenLayers, Material overrides, and reusable layout rules in `app.scss`.
- Keep cards to repeated layer items and avoid nested cards.
- Ensure long Swedish place names, coordinates, roles, and layer labels wrap without causing horizontal overflow.
