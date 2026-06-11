# AI Quality Constitution

These rules constrain AI agents working in this repo.

## Articles

1. Specs own intent. Code serves the spec.
2. Ambiguity must be written down as `[NEEDS CLARIFICATION]`.
3. Tests describe public behavior, not implementation shape.
4. Agents work vertically: one behavior, one failing test, one implementation.
5. GIS correctness is product correctness.
6. Permissions are acceptance criteria.
7. Exports must match visible data.
8. Localization and time assumptions must be explicit.
9. Refactor only after green tests.
10. No speculative abstractions without documented rationale.

## Review Questions

- Would this test fail if user-visible behavior broke?
- Would this test survive a private refactor?
- Does the spec state why the behavior matters?
- Are roles, projections, locale, and export formats explicit?
- Did the implementation add functionality not requested by the current slice?

## Agent Stop Conditions

Stop and update the spec or ask the user when:

- Product behavior conflicts with technical assumptions.
- A role/permission rule is unclear.
- A projection or coordinate system assumption is missing.
- Export output is ambiguous.
- A dependency upgrade would require a major stack decision.
