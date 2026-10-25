<!--
Follow each comment, then delete it.
- Style: about 50% ASD-STE100, in the repo's and requester's terms. Write for library users.
- Keep it as short as the change: a docs or tooling PR gets one or two lines per section. Say each
  point once. Skip what the diff shows (files touched, tests, changesets). Optional sections default
  to absent.
- Keep attribution your tool requires. Delete "Fixes #" if there is no issue.
- Changed packages/*? Run `yarn test:coverage`; coverage must not drop.
-->

Fixes #

### Motivation
<!--
No library behavior change (docs, website, tooling, refactor)? One sentence, then stop.
Else start with "Bug fix.", "New use case." or "Improvement.", then:
1. Trigger: the conditions, in user terms. Example shape: "A component reads an entity through two
   schemas, one nested in a Union."
2. One real (linked) or realistic instance: what the user saw vs. expected, or what it cost.
-->

### Solution
<!--
Approach, key decisions, trade-offs. Group several changes by kind (API, behavior, types, internal).
User code changes: before/after code from the changesets; never invent a "before".
Diagram (Mermaid or image) only when clearer than text.
-->
<!--
Add "#### Architecture change" only if core machinery now works differently (store, normalize/
denormalize, memoization, Controller/Manager flow, Schema or Endpoint contracts). Fixes, options,
types, and refactors never qualify. 3Blue1Brown-style: trace one concrete case through the old flow,
then the new one. Mermaid if over three steps.
-->

### Assumptions and validation
<!--
Assumptions not proven ("none" if none), checks run and what they cover, what is untested.
Tag each high, medium, or low certainty.
-->

<!-- Add "### Methodology" only if how you got here matters: reproduction, benchmark, alternatives. -->

<!-- Add "### GOALS impact" only if a GOALS.md goal moves or is traded off: goal, direction, evidence. -->

<!-- Add "### Open questions" only for feedback you want. -->
