---
name: tdd-metria
description: Use when implementing or changing application behavior with TDD in this Angular/GIS repo. Guides agents through one public-interface test, minimal implementation, and refactor while preserving Metria-specific quality rules.
---

# Metria TDD Skill

Use this skill when adding or changing behavior in the application.

## Core Rule

One behavior at a time:

```text
RED -> GREEN -> REFACTOR
```

Do not write all tests first. Do not implement all behavior first.

## Red

Write one failing test that describes public behavior.

Good targets:

- `buildLayerDecisionView` for role/projection/export policy.
- Angular Testing Library for visible component behavior.
- Cypress for critical user journeys.

Bad targets:

- private component methods
- internal RxJS operators
- collaborator call counts
- exact DOM structure unrelated to user behavior

## Green

Implement the smallest change that passes the current test.

Do not add future behavior unless the current test requires it.

## Refactor

After green:

- remove duplication
- improve names
- deepen public modules
- keep tests unchanged

Run the narrowest test after each refactor.

## Metria Quality Checks

- Are roles and restricted geodata explicit?
- Are projections and SRIDs explicit?
- Does export readiness match visible selected data?
- Is locale/date formatting part of the behavior when user-visible?
- Would the test survive an internal refactor?
