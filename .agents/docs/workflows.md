# Workflows

## Local Setup

```sh
npm install
npm start
```

Open `http://localhost:4200`.

## Installed Agent Tooling

- GSD Core is installed locally for Codex in `.codex/` with the full skill profile and Codex hooks.
- `.claude` is a symlink to `.agents`, so existing `.agents/commands/` prompts remain available to Claude-style tooling.

## Product Change Flow

1. Start from the current map app behavior, tests, and source code.
2. Clarify product behavior before changing implementation details.
3. Add or update one public behavior test.
4. Implement the smallest change that makes the behavior pass.
5. Verify with the relevant unit, component, or Cypress flow.

For larger phase-based efforts, use GSD Core from `.codex/skills/`; start new GSD
work with `$gsd-new-project` when the project needs a full Discuss -> Plan ->
Execute -> Verify -> Ship loop.

## TDD Flow

```text
RED: write one failing test for public behavior
GREEN: write the smallest implementation that passes
REFACTOR: clean up only after all tests are green
```

Good first slice:

```sh
npm test -- src/app/layer-decision-support/layer-access-policy.spec.ts
```

## Storybook Flow

```sh
npm run storybook
```

Use Storybook to inspect loading, loaded, restricted, projection-warning, and export-ready states.

## Cypress Flow

```sh
npm start
npm run e2e
```

Cypress assumes the Angular dev server is already running.

## Quality Gate

```sh
npm run quality
```

Run this before handing a task to another agent or merging changes.
