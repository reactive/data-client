# bulletproof-react impact results

Measured 2026-11-07 with [`../impact.config.mjs`](../impact.config.mjs), 8 interleaved runs per pair at 4x
CPU throttle, mock API latency fixed at 400ms ([`../fixed-latency.patch`](../fixed-latency.patch)).

| Variant                  | Source                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react-query              | `alan2207/bulletproof-react` @ `9506629`, `apps/react-vite`                                                                                                                                  |
| data-client              | the same commit plus `migration.patch` from [#4607](https://github.com/reactive/data-client/pull/4607) @ `daada76`                                                                           |
| data-client + optimistic | the same commit plus `migration.patch` from [#4607](https://github.com/reactive/data-client/pull/4607) @ `5258d83` (optimistic comment create and delete, discussion update, profile update) |

Each report's Setup table shows the checkout's own HEAD, its uncommitted-file count and a working-tree
fingerprint. The optimistic checkout has a local commit; the table above names the patch each variant
applied.

## Mutations

Time from submit until the UI shows the change, median of 8 runs (ms).

| Mutation                             | react-query | data-client      | data-client + optimistic |
| ------------------------------------ | ----------- | ---------------- | ------------------------ |
| create discussion                    | 1,412       | 1,421            | 1,417                    |
| update discussion                    | 1,409       | 899              | 111                      |
| create comment                       | 1,407       | 888              | 145                      |
| delete comment                       | 1,401       | 892              | 94                       |
| update profile                       | 1,399       | 904              | 104                      |
| delete discussion                    | 1,406       | 897              | 890                      |
| **sum of 6**                         | **8,431**   | **5,887 (-30%)** | **2,781 (-67%)**         |
| refetches triggered (requests)       | 6           | 2                | 2                        |
| stale views after a mutation (views) | 2           | 0                | 0                        |

Data-client saves one round trip on five mutations: react-query refetches before the UI changes,
data-client updates the normalized entity from the mutation response. Optimistic updates remove the
remaining round trip. Create and delete discussion are not optimistic in either version.

An earlier version of these results timed delete discussion at about 73ms in every build. That was the
click: the confirmation dialog hid the row from the accessibility tree, so the check for the row's removal
passed at once. The flow now waits for the row itself to go.

The optimistic version's slowest interaction is 76ms, against 40 to 52ms in the other two builds, and
its total blocking time is 15 to 18ms against 0 to 1. A likely cause is that the optimistic update renders
inside the click handler's task; no trace confirms it yet.

## Tokens per feature

[`../feature.config.mjs`](../feature.config.mjs) asks an agent (Sonnet, medium effort) to add comment counts
to the discussions list and page and keep them correct after creating or deleting a comment. A hidden
e2e test checks the result. 2 runs per variant, so no verdicts yet. These runs used the prompt and tool allowlist at
[`53e9112`](https://github.com/reactive/data-client/commit/53e9112), which also allowed `npx prettier --check`; the kit has since removed that and appends the
allowlist to the prompt, so a re-run is not directly comparable.

| Metric (unit)         | react-query | data-client + optimistic |
| --------------------- | ----------- | ------------------------ |
| Tokens, all (tokens)  | 779,816     | 1,156,346 (+48%)         |
| Cost (USD)            | 0.29        | 0.42                     |
| Agent turns (turns)   | 23          | 38                       |
| Lines changed (lines) | 40.5        | 78                       |
| Acceptance passed     | 2 of 2      | 2 of 2                   |

Data-client cost more here, and the diffs show why. Both react-query runs added
`invalidateQueries({ queryKey: ['discussions'] })` after each comment mutation. The data-client runs had no
data-client skills in the checkout (the migration committed `skills-lock.json` but not the skill files), and
neither found a data-client pattern for a server-computed count on a parent entity. One threaded
`onCountChange` callbacks through four components; the other called `invalidateAll` on the list and refetched
the discussion. This is a skill gap to fix and re-measure, not a property of the library.

## Reports

- [react-query vs data-client](react-query-vs-data-client/impact.md)
- [react-query vs data-client + optimistic](react-query-vs-data-client-optimistic/impact.md) (includes tokens per feature)
- [data-client vs data-client + optimistic](data-client-vs-data-client-optimistic/impact.md)

Each folder also holds `impact.json` (all rows), `flow.json`, `static.json` and `feature.json` (raw samples) and
`meta.json`.
