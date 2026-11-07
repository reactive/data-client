# bulletproof-react impact results

Measured 2026-11-07 with [`../impact.config.mjs`](../impact.config.mjs), 8 interleaved runs per pair at 4x
CPU throttle, mock API latency fixed at 400ms ([`../fixed-latency.patch`](../fixed-latency.patch)).

| Variant                  | Source                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| react-query              | `alan2207/bulletproof-react` @ `9506629`, `apps/react-vite`                                                                             |
| data-client              | the same commit plus `migration.patch` from #4607 @ `daada76`                                                                           |
| data-client + optimistic | the same commit plus `migration.patch` from #4607 @ `5258d83` (optimistic comment create and delete, discussion update, profile update) |

The commit shown in each report's Setup table is the checkout's own HEAD, so the migrated variants show a
local commit; the table above names the patch each one applied.

## Mutations

Time from submit until the UI shows the change, median of 8 runs (ms).

| Mutation                             | react-query | data-client      | data-client + optimistic |
| ------------------------------------ | ----------- | ---------------- | ------------------------ |
| create discussion                    | 1,396       | 1,384            | 1,400                    |
| update discussion                    | 1,394       | 882              | 112                      |
| create comment                       | 1,395       | 877              | 130                      |
| delete comment                       | 1,392       | 875              | 84                       |
| update profile                       | 1,384       | 880              | 92                       |
| delete discussion                    | 73          | 73               | 75                       |
| **sum of 6**                         | **7,032**   | **4,975 (-29%)** | **1,888 (-73%)**         |
| refetches triggered (requests)       | 6           | 2                | 2                        |
| stale views after a mutation (views) | 2           | 0                | 0                        |

Data-client saves one round trip on four mutations: react-query refetches after them, data-client
updates the normalized entity from the mutation response. Optimistic updates remove the remaining round
trip. Create and delete discussion are not optimistic in either version.

The optimistic version's slowest interaction rises from about 40ms to 76ms, and total blocking time from
0 to about 12ms. The optimistic update renders inside the click handler's task.

## Reports

- [react-query vs data-client](react-query-vs-data-client/impact.md)
- [react-query vs data-client + optimistic](react-query-vs-data-client-optimistic/impact.md)
- [data-client vs data-client + optimistic](data-client-vs-data-client-optimistic/impact.md)

Each folder also holds `impact.json` (all rows), `flow.json` and `static.json` (raw samples) and
`meta.json`.
