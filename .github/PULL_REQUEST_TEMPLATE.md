<!--
How to write this description (for humans and agents). Delete every comment when you fill it in.

- Style: about 50% ASD-STE100 Simplified Technical English. Follow its spirit, not every rule:
  short sentences, active voice, one idea per sentence. Name the thing ("the Post entity", not "it").
  Use the terms that the repo, its docs, or the requester already use. Do not invent new names.
- Write for a library user first and a reviewer second. Keep each section short.
- Some sections are conditional: the first line of their comment says when to include them.
  Delete a conditional section, heading included, when its condition does not hold.
- Diagrams: use one only when a picture is clearer than text. Few nodes, labels in user terms,
  no decoration. Prefer Mermaid. Use an image only with a URL that already works (never a local path).
- Keep any header lines your tool requires (such as an attribution block) as the first lines.
- Delete the "Fixes #" line when there is no linked issue.
- Before you open the PR, run `yarn test:coverage` and make sure coverage does not decrease.
-->

Fixes #

### Motivation
<!--
Write two short paragraphs:
1. The trigger: the abstract conditions, from a library user's point of view, that cause the problem
   or need, in the fewest terms possible. The shape (do not copy the words): "A component reads an
   entity through two different schemas, and one schema is nested in a Union."
2. One simple instance of those conditions. Prefer a real case (an issue, a user report, a real app)
   and link it. Otherwise make it realistic. Show what the user saw and what they expected.
When the trigger is obvious (for example, a typo fix), write one sentence instead.
-->

### Solution
<!--
Give the change at a high level, then the key decisions and why you made them.
Include the before/after user code from this PR's changesets, if it has any. Use code only when
user code changes; describe runtime-only changes in prose.
When there is more than one change, list them grouped by kind (for example: API, behavior, types,
docs, tests, internal), one short bullet per change. Name the package when it matters.
-->

#### Architecture change
<!--
Include only when the PR changes core Data Client architecture: store shape, normalize/denormalize,
memoization, the Controller/Manager action flow, Schema or Endpoint contracts, or a contract
between packages.
Explain it in the 3Blue1Brown style: start from a concrete picture, add one idea at a time,
and build the reader's intuition before you name the mechanism. Show the old flow and the new flow.
Add a clean diagram when it helps.
-->

#### Other changes
<!--
Include only when "Architecture change" is included. List the remaining changes here, grouped as
described under Solution, instead of under Solution itself.
-->

### Assumptions and validation
<!--
- Assumptions: list what this change relies on but does not prove (runtime, versions, user behavior).
- Validation: list how you checked the change (tests, benchmarks, type-check, manual steps, preview link)
  and what each check covers.
- Certainty: give each assumption and each validation result a level (high, medium, low) with a reason.
  Say plainly what you did not test.
-->

### GOALS impact
<!--
Include only when the change affects GOALS.md in a non-trivial way. Name each goal.
Say if the change moves it forward or trades it off, and give the reason or the measurement.
-->

### Open questions
<!--
Include only when you have design questions or want specific feedback from reviewers.
-->
