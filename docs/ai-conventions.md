# AI Conventions

This file is a human-facing summary of how to use agents in the project.

## Default Flow

1. Read `AGENTS.md`.
2. Read `.agents/docs/index.md` when deeper context is needed.
3. Inspect the current code and tests for the relevant map behavior.
4. Implement one vertical behavior at a time.
5. Use TDD for behavior changes.
6. Run the narrowest test first, then `npm run quality` before handoff.

## Prompt Examples

```text
Read AGENTS.md and the relevant source/test files.
Implement one map behavior using one red-green-refactor cycle.
Do not test private methods.
```

```text
Review the current change against .agents/docs/ai-quality-constitution.md.
Lead with findings and include file/line references.
```

```text
Add support for a new export metadata behavior.
State unknown product decisions explicitly instead of guessing.
```

## What Good Looks Like

- The agent names the behavior before writing code.
- The first test fails for the right reason.
- Implementation is smaller than the test.
- Refactor leaves tests unchanged.
- Docs stay current when behavior changes.
