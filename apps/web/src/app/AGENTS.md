# Angular Map App Context

This directory contains the Angular 20 standalone map application. Treat this as a
real geospatial product surface.

## Commands

```sh
npx vitest run --config apps/web/vitest.config.ts src/app/map-workbench/search/location-search-policy.spec.ts
npx vitest run --config apps/web/vitest.config.ts src/app/map-workbench/layers/layer-access-policy.spec.ts
npx vitest run --config apps/web/vitest.config.ts src/app/app.spec.ts
npm run build
```

## Structure

- `app.ts`, `app.html`, `app.scss` - thin root shell for the map workbench feature.
- `map-workbench/` - map shell, OpenLayers orchestration, search UI, layer controls, auth/account UI, and responsive overlay styling.
- `map-workbench/layers/` - layer availability policy, selected layer normalization, and render ordering.
- `map-workbench/search/` - search target models and coordinate formatting for selected locations.
- `map-workbench/workbench-data/` - GraphQL-backed workbench data adapter and API response models.
- `app.spec.ts` - component behavior smoke test through Testing Library.
- `app.stories.ts` - Storybook states for visual review.
- `auth/` - Keycloak startup, login/logout, token role extraction, and app role mapping.
- `shared/` - cross-feature API and authorization contracts.

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

- Search behavior: test through coordinate formatting, backend-backed API responses, and visible component outcomes.
- Layer behavior: call public functions such as `buildLayerDecisionView` and `nextSelectedLayerIds`.
- Component behavior: render with Testing Library and assert visible output/interactions.
- E2E behavior: use Cypress for search, layer toggles, restricted geodata disabled state, account UI, and viewport fit.
- Avoid private method tests and implementation call-count tests.
- Add one test at a time during TDD cycles.

## Styling

- Use Angular Material for familiar controls and menus.
- Use Tailwind for layout and spacing when it keeps the template readable.
- Keep app-specific OpenLayers, Material overrides, and reusable layout rules in the component stylesheet that owns the UI.
- Keep cards to repeated layer items and avoid nested cards.
- Ensure long Swedish place names, coordinates, roles, and layer labels wrap without causing horizontal overflow.
