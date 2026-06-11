# review-quality

Review the current branch against the AI quality constitution.

**Usage:** `/review-quality`

## Steps

1. Read `AGENTS.md`.
2. Read `.agents/docs/ai-quality-constitution.md`.
3. Inspect changed files.
4. Prioritize findings in this order:
   - behavior gaps against the spec
   - brittle or implementation-coupled tests
   - missing role/projection/export/localization assumptions
   - unnecessary abstraction
   - missing docs updates
5. Report findings with file and line references.

## Verify

Run `npm run quality` when changes are substantial and the environment is available.
