<!--
Read every comment, then delete them all.
- Style: about 50% ASD-STE100: short active sentences, one idea each, in the repo's and requester's
  terms. Write for library users first.
- Size to the change: docs or tooling 1-3 sentences; small fix or option under 200 words; feature
  under 400. Optional sections default to absent.
- Say each point once. Solution skips tests, docs, and changesets: the diff shows them.
- Diagrams only when clearer than text: Mermaid, or an image with a working URL.
- Keep attribution where your tool requires it. Delete "Fixes #" if there is no issue.
- Changed packages/*? Run `yarn test:coverage` first; coverage must not drop.
-->

Fixes #

### Motivation
<!--
No user-facing trigger (typo, tooling, refactor)? One sentence on what was wrong, then stop.
Else start with "Bug fix.", "New use case." or "Improvement.", then two short paragraphs:
1. Trigger: the conditions, in user terms, that cause the need. Shape, not text to copy:
   "A component reads an entity through two different schemas, and one schema is nested in a Union."
2. One real (linked) or realistic instance. Bug: what the user saw vs. expected. Else: what they
   could not do, or what it cost (requests, renders, ms).
-->

### Solution
<!--
High level, then key decisions, trade-offs, and why. Several changes: group by kind (API, behavior,
types, internal), one bullet each.
User code changes: before/after code, from the changesets when they have it. Never invent a "before".
Behavior-only: old vs. new in one sentence each, unless Motivation already says it.
-->
<!--
Most PRs have none. Add "#### Architecture change" only if a maintainer's mental model of core
machinery is wrong afterwards (store shape, normalize/denormalize, memoization, Controller/Manager
flow, Schema or Endpoint contracts, cross-package assumptions). Fixes, options, types, docs, and
same-model refactors never qualify.
3Blue1Brown-style, 150-300 words: name it, trace one concrete case through the old flow to where it
fails, then through the new flow, one idea per step. Mermaid if over three steps. The "why" lives here only.
-->

### Assumptions and validation
<!--
- Assumptions the change relies on but does not prove, or "none".
- Checks run and what each covers; what you did not test.
- Tag every item high, medium, or low; give a reason for medium and low. One line each for small PRs.
-->

<!--
Add "### Methodology" only if how you got here matters to a reviewer (reproduction, benchmark or eval
setup, rejected alternatives, root-cause search): a few bullets on what you did and on what inputs.
-->

<!--
Add "### GOALS impact" only if the change measurably moves or trades off a GOALS.md goal (bundle size,
requests, renders, referential stability, concurrent rendering, platforms, version ranges): goal,
direction, measurement or reason.
-->

<!--
Add "### Open questions" only for design questions or specific feedback you want.
-->
