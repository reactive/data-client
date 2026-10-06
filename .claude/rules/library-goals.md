---
paths:
  - "packages/**"
---
<!-- Generated from .cursor/rules/library-goals.mdc by `yarn build:agent-rules`. Edit the source. -->


# Library Goals Alignment

When editing library code in `packages/*`, read [GOALS.md](../../GOALS.md) and weigh changes against it. It is the source of truth for project priorities — do not rely on a summary of it.

- Evaluate design decisions (new APIs, abstractions, dependencies) against the goals before implementing.
- When goals conflict for a given change (e.g. bundle size vs. performance), resolve the trade-off using the priorities expressed in GOALS.md, and note the reasoning.
- If a requested change works against the goals, say so and propose an alternative that stays aligned.
