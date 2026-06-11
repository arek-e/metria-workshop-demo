# tdd-cycle

Run one red-green-refactor cycle for the current vertical slice.

**Usage:** `/tdd-cycle [behavior]`

## Steps

1. Use `$ARGUMENTS` as the behavior under test.
2. Find the public interface that should expose the behavior.
3. Write exactly one failing test.
4. Run the narrowest relevant test command.
5. Implement the minimum code required to pass.
6. Run the same test again.
7. Only after green, consider a small refactor.

## Rules

- Do not write multiple tests up front.
- Do not test private helpers.
- Do not mock the behavior being specified.
- Do not add speculative branches for future tests.
