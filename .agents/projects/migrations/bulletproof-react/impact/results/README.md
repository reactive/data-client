# bulletproof-react impact results

Each report runs 8 interleaved runs per pair at 4x CPU throttle with [`../impact.config.mjs`](../impact.config.mjs),
and the mock API latency fixed by [`../fixed-latency.patch`](../fixed-latency.patch). Speed is react-query time
divided by data-client time: 1.2x means data-client is 20% faster, 0.8x means 20% slower.

## 0.19 beta

Measured 2026-11-08 by the 0.19 re-run, on `@data-client/react` and `@data-client/rest`
`0.19.0-beta-20261108175612`, with every mutation optimistic. The re-run's checkouts are local commits
(`18d155d` and `9c8de5a`); its `migration.patch` also applies cleanly to upstream
`alan2207/bulletproof-react` @ `9506629`.
Report: [react-query vs data-client 0.19](react-query-vs-data-client-0.19/impact.md).

| Metric                                       | react-query | data-client 0.19 | Speed or change    |
| -------------------------------------------- | ----------- | ---------------- | ------------------ |
| Mutation submit to UI updated, sum of 6 (ms) | 8,516       | 2,014            | 4.2x (323% faster) |
| All 13 steps, action to ready (ms)           | 11,492      | 4,959            | 2.3x (132% faster) |
| Cold load, first screen ready (ms)           | 1,801       | 1,818            | ≈1x (within noise) |
| Slowest interaction (ms)                     | 56          | 92               | 0.61x (39% slower) |
| Reads triggered by mutations                 | 6           | 2                | -4                 |
| Stale views after a mutation                 | 2           | 0                | -2                 |
| Entry JS, gzip (kB)                          | 178         | 163              | -8%                |
| Data layer lines of code                     | 514         | 174              | -66%               |

Per mutation: delete discussion 16.3x, delete comment 13.9x, update discussion 11.9x, update profile
11.2x, create comment 9.2x, and create discussion ≈1x, because it still waits for the server to return
the new row.

**Interaction cost.** Each optimistic mutation's click now takes longer to paint: create comment 32 →
84ms, update discussion 28 → 56ms, delete comment 16 → 44ms. The optimistic dispatch renders
synchronously inside the click (discrete priority). A CPU profile of the 0.18.2 build put about a third
of create comment's click in bulletproof's unmemoized `MDPreview` (marked and DOMPurify).

**Latency sweep.** The same pair re-measured on 2026-11-08 at three mock API latencies with `--sweep`
([report](react-query-vs-data-client-0.19-sweep/impact.md)). Its 400ms run reproduces the numbers above
within 2%.

| Mock API latency | Mutations, react-query (ms) | Mutations, data-client 0.19 (ms) | Mutation speed | All steps speed |
| ---------------- | --------------------------- | -------------------------------- | -------------- | --------------- |
| 100ms            | 3,018                       | 1,496                            | 2.0x           | 1.51x           |
| 400ms            | 8,578                       | 1,984                            | 4.3x           | 2.4x            |
| 1000ms           | 14,573                      | 2,992                            | 4.9x           | 2.7x            |

Each optimistic mutation shows its change in 86 to 155ms at every latency, while react-query's grow with
the server's response time. Create discussion is the one that still waits for the server in both builds,
so it scales with latency and most of data-client's growing total comes from it. The slowest interaction
is 0.52x to 0.60x at every latency, because it is CPU work in the click, not network.

## 0.18.2

**These are `@data-client/react` 0.18.2 results**, measured 2026-11-07 before the 0.19 beta existed. They are
kept for comparison; the 0.19 numbers above replace them. Each 0.18.2 report's flow rows were recomputed from
the saved samples to add the speed column and the newer rows; no numbers changed.

| Variant                  | Source                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react-query              | `alan2207/bulletproof-react` @ `9506629`, `apps/react-vite`                                                                                                                                  |
| data-client              | the same commit plus `migration.patch` from [#4607](https://github.com/reactive/data-client/pull/4607) @ `daada76`                                                                           |
| data-client + optimistic | the same commit plus `migration.patch` from [#4607](https://github.com/reactive/data-client/pull/4607) @ `5258d83` (optimistic comment create and delete, discussion update, profile update) |

Each report's Setup table shows the installed data library versions (read from the checkouts after
these runs, before the kit recorded them), the checkout's own HEAD, its uncommitted-file count and a working-tree
fingerprint. The optimistic checkout has a local commit; the table above names the patch each variant
applied.

### Mutations

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

Data-client saves one round trip on five mutations. On four of them react-query refetches and data-client
updates the normalized entity from the mutation response, so the refetch never happens. On delete
discussion both builds refetch the list, but data-client removes the row from the delete response
without waiting for it. Optimistic updates remove the
remaining round trip. Create and delete discussion are not optimistic in either version.

An earlier version of these results timed delete discussion at about 73ms in every build. That was the
click: the confirmation dialog hid the row from the accessibility tree, so the check for the row's removal
passed at once. The flow now waits for the row itself to go.

The optimistic version's slowest interaction is 76ms, against 40 to 52ms in the other two builds, and
its total blocking time is 15 to 18ms against 0 to 1. The optimistic update renders inside the click
handler's task; see Interaction cost above.

### Tokens per feature

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
data-client skills in the checkout: the 0.18 install path (`npx skills add`) committed `skills-lock.json`
but not the skill files. On 0.19 the skills ship in the packages and are symlinked into the app; the beta
re-run will show whether that closes the gap. Neither run found a data-client pattern for a server-computed count on a parent entity. One threaded
`onCountChange` callbacks through four components; the other called `invalidateAll` on the list and refetched
the discussion. This is a skill gap to re-measure on 0.19, not a property of the library.

## Reports

- [react-query vs data-client 0.19](react-query-vs-data-client-0.19/impact.md)
- [react-query vs data-client 0.19, latency sweep](react-query-vs-data-client-0.19-sweep/impact.md)
- [react-query vs data-client](react-query-vs-data-client/impact.md) (0.18.2)
- [react-query vs data-client + optimistic](react-query-vs-data-client-optimistic/impact.md) (0.18.2, includes tokens per feature)
- [data-client vs data-client + optimistic](data-client-vs-data-client-optimistic/impact.md) (0.18.2)

Each folder also holds `impact.json` (all rows), `flow.json`, `static.json` and `feature.json` (raw samples) and
`meta.json`.
