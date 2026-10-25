<!--
Read every comment, then delete them all.
- Style: about 50% ASD-STE100: short sentences, active voice, one idea each. Keep the repo's and
  requester's terms. Write for library users first, reviewers second.
- Say each point once. Do not restate Motivation in Solution, or Solution in Assumptions. Solution
  does not list or describe tests, docs, or changesets: the diff shows them. Small fix: under 250 words.
- Diagrams only when clearer than text. Use Mermaid; an image needs a working URL, never a local path.
- Keep attribution lines where your tool requires them. Delete "Fixes #" if there is no issue.
- Changed packages/*? Run `yarn test:coverage` first; coverage must not drop.
-->

Fixes #

### Motivation
<!--
No user-facing trigger (typo, tooling, refactor)? One sentence on what was wrong, then stop.
Otherwise, start with "Bug fix.", "New use case." or "Improvement." Then two short paragraphs:
1. Trigger: the conditions, in user terms, that cause the need. Shape, not text to copy:
   "A component reads an entity through two different schemas, and one schema is nested in a Union."
2. One instance: a real case (link it) or a realistic one. Bug: what the user saw vs. expected.
   Otherwise: what they could not do, or what it cost (requests, renders, ms).
-->

### Solution
<!--
High level, then key decisions, trade-offs, and why. Group several changes by kind (API, behavior,
types, internal), one bullet each.
User code changes: before/after code, copied from the changesets when they have it. Never invent a "before".
Behavior-only change: old and new behavior, one sentence each, unless Motivation already says it.
-->
<!--
Add "#### Architecture change" here only if a maintainer's mental model of core machinery is wrong
afterwards (store shape, normalize/denormalize or memoization, Controller/Manager flow, Schema or
Endpoint contracts, cross-package assumptions). A fix that restores documented behavior is not one.
Open with one naming sentence. Then 3Blue1Brown-style: trace one concrete case through the old flow,
show where it fails, then through the new flow, one idea per step. 150-300 words; a Mermaid diagram
if the flow has more than three steps. Keep the "why" here, not also in Solution.
-->

### Assumptions and validation
<!--
- Assumptions this change relies on but does not prove, or "none".
- Checks you ran and what each covers. Say what you did not test.
- Tag every item high, medium, or low certainty, including what you did not run; give a reason for
  medium and low. One line each for a small PR.
-->

<!--
Add "### Methodology" only if how you reached the solution matters to a reviewer: a reproduction,
benchmark or eval setup, alternatives you tried and rejected, or how you found the root cause.
A few bullets: what you did and on what inputs. Results go in Assumptions and validation.
-->

<!--
Add "### GOALS impact" only if the change measurably moves or trades off a GOALS.md goal (bundle size,
requests, renders, referential stability, concurrent rendering, platforms or version ranges).
Name each affected goal, the direction, and the measurement or reason.
-->

<!--
Add "### Open questions" only for design questions or specific feedback you want.
-->
