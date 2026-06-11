# Coding Standards

## TypeScript

- Prefer explicit domain types for public interfaces.
- Keep type aliases close to the module they describe.
- Avoid `any`; use narrow unions for roles, locale, formats, and projections.
- Do not expose implementation helper functions unless a caller needs them.

## Angular

- Use standalone components.
- Keep components thin: render state, handle events, delegate decisions.
- Prefer signals for local application state.
- Keep accessibility labels meaningful because Cypress and Testing Library rely on them.

## API

- Keep Fastify route registration in `apps/api/src/server.ts` behind `buildServer`.
- Test API behavior with `server.inject` instead of opening sockets.
- Read environment variables with bracket syntax because the workspace enables `noPropertyAccessFromIndexSignature`.
- Keep the API boundary explicit before wiring Angular data access to it.

## Testing

- Tests should verify behavior through public interfaces.
- Do not test private methods.
- Do not assert internal collaborator call counts unless the call itself is the product behavior.
- Use deterministic fixtures for geodata examples.
- Use tolerance-based assertions for floating point GIS calculations.

## Styling

- Angular Material provides controls.
- Tailwind is available for utility styling, but custom SCSS owns the application layout.
- Keep text readable on mobile and desktop.
- Avoid decorative gradients/orbs that do not communicate product state.

## Dependencies

- Pin packages to Angular 20-compatible lines.
- Do not force peer conflicts for workshop convenience.
- If `npm audit` reports issues from optional dependencies, document the tradeoff before changing major versions.
