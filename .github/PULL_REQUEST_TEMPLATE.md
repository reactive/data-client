<!--
How to write this description. Read every comment first, then delete all of them.

- Style: about 50% ASD-STE100 Simplified Technical English. Follow its spirit, not every rule:
  short sentences, active voice, one idea per sentence. Name the thing ("the Post entity", not "it").
  Use the terms the repo, its docs, or the requester already use.
- Write for a library user first and a reviewer second. Keep each section short.
- Some sections are added only when a condition holds. Their headings are inside the comments below.
- Diagrams: only when a picture is clearer than text. Few nodes, labels in user terms.
  Prefer Mermaid; use an image only with a URL that already works, never a local path.
- Keep any attribution lines your tool adds where your tool requires them.
- Delete the "Fixes #" line when there is no linked issue.
- When the PR changes code under packages/*, run `yarn test:coverage` before you open it and make
  sure coverage does not decrease.
-->

Fixes #

### Motivation
<!--
For a change with no user-facing trigger (a typo, tooling, an internal refactor with no behavior
change), write one sentence on what was wrong and stop.
Otherwise say whether this fixes a bug, enables a new use case, or improves existing behavior.
Then write two short paragraphs:
1. The trigger: the conditions, from a library user's point of view, that cause the problem or need,
   in the fewest terms possible. Shape only, do not copy: "A component reads an entity through two
   different schemas, and one schema is nested in a Union."
2. One simple instance of those conditions. Prefer a real case (an issue, a user report, a real app)
   and link it; otherwise make it realistic. For a bug: what the user saw and what they expected.
   For a use case or improvement: what they could not do, or what it cost them (requests, renders, ms).
-->

### Solution
<!--
Give the change at a high level, then the key technical decisions, their trade-offs, and why you
made them.
When user code changes, show before and after code. Take it from this PR's changesets when they
have it (do not rewrite it); otherwise write it from the diff. Never invent a "before" no user wrote.
When behavior changes but user code does not, state the old and the new behavior in one sentence each.
When there is more than one change, list them grouped by kind (for example: API, behavior, types,
docs, tests, internal), one short bullet per change. Name the package when it matters.
-->
<!--
Add a "#### Architecture change" subsection here only when the PR changes how core Data Client
machinery works, so a maintainer's current mental model of it is wrong afterwards: store shape,
the normalize/denormalize or memoization algorithm, the Controller/Manager action flow, the Schema
or Endpoint contracts, or what one package may assume about another. A fix that makes existing
behavior match its documented contract is not an architecture change.
First sentence: name the change for skimmers. Then explain it the 3Blue1Brown way: pick one
concrete case (one entity, one request, one component) and trace it through the old flow, show
where that flow fails or costs too much, then trace the same case through the new flow, adding one
idea per step, so the reader sees why before you name the mechanism. Use a Mermaid diagram when a
flow has more than three steps. Aim for 150-300 words plus at most one diagram. Put the "why" here
and keep the Solution opening above to one or two sentences, so the explanation exists once.
-->

### Assumptions and validation
<!--
- Assumptions: what this change relies on but does not prove (runtime, versions, user behavior).
  Write "none" when there are none.
- Validation: how you checked the change (tests, benchmarks, type-check, manual steps, preview link)
  and what each check covers.
- Tag each item high, medium, or low certainty. Give a reason only for medium and low.
  Say plainly what you did not test. Size this section to the change: a one-line fix needs one line each.
-->

<!--
Add a "### GOALS impact" section only when the change measurably moves or trades off a goal listed
in GOALS.md (bundle size, requests, renders, referential stability, concurrent-rendering behavior,
supported platforms or version ranges). Name each goal touched, say whether it moves forward or is
traded off, and give the measurement or the reason. Do not list goals that are unaffected.
-->

<!--
Add a "### Open questions" section only when you have design questions or want specific feedback
from reviewers.
-->
