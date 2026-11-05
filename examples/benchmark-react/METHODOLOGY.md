# React Benchmark Methodology

The full details behind the [React rendering benchmarks](https://dataclient.io/docs/concepts/performance#react-rendering-benchmarks):
the machine, versions, how each library is configured, how samples are taken, and every
number the charts were drawn from. The benchmark source is in this directory, so you can run it
yourself, change it, or point it at your own workload.

## Summary

- The charts come from two local runs on **2026-11-05** at commit
  [`fde2da8`](https://github.com/reactive/data-client/commit/fde2da82122096f24b92e789722469271918b5c3) (master after
  [#4580](https://github.com/reactive/data-client/pull/4580), plus the harness fix in
  [#4584](https://github.com/reactive/data-client/pull/4584)).
- Each simulated request costs **40 ms + 1 ms per 20 records**.
  Most of the gap comes from requests Data Client doesn't wait for or repeat:
  - Navigation renders detail views from entities already in the list response.
  - Mutations update the store [optimistically](https://dataclient.io/docs/getting-started/mutations) in one write.
  - The other libraries wait for the mutation response, then invalidate and refetch.
- Ratios on the [Performance page](https://dataclient.io/docs/concepts/performance) are relative to the plain React baseline.
  Against TanStack Query and SWR directly, navigation is **21.1x** and **21.4x**, and the
  `update-entity` mutation is **186.5x** and **187.5x**.

## Environment

| | |
|---|---|
| Date | 2026-11-05 |
| Commit | [`fde2da8`](https://github.com/reactive/data-client/commit/fde2da82122096f24b92e789722469271918b5c3) |
| CPU | AMD Ryzen 9 7950X |
| Memory | 64 GB |
| OS | Ubuntu on WSL2 (Windows host) |
| Node | 26.12.1 |
| Browser | Headless Chromium bundled with Playwright 1.64.0 |
| CPU throttling | None |
| Build | Webpack production build with React Compiler enabled for all four apps |

The runs were on a developer workstation, not an isolated machine. The exact Chromium version and
WSL kernel were not recorded. See the [README](./README.md#methodology)
for how the benchmark runs today.

### Library versions

| Library | Version |
|---|---|
| `@data-client/react` | Workspace source at the commit above (0.18.1) |
| `@tanstack/react-query` | 5.96.2 |
| `swr` | 2.5.1 |
| `react` / `react-dom` | 19.3.1 |

## How each library is configured

All four apps render the same presentational components (`src/shared/components.tsx`), using the same
GitHub-issue-shaped fixtures, and talk to the same in-memory server running in a Web Worker.
Each app only wires its own data layer, following that library's documented patterns.

| | Data Client | TanStack Query | SWR | Baseline |
|---|---|---|---|---|
| Reads | `useSuspense` / `useDLE` on [resource()](https://dataclient.io/rest/api/resource) endpoints | `useQuery` | `useSWR` | `useEffect` + `useState` |
| Cache config | `dataExpiryLength: Infinity`; GC sweep disabled during timing | `staleTime: Infinity`, `gcTime: Infinity` | `revalidateOnFocus`, `revalidateOnReconnect`, `revalidateIfStale` `false`; `revalidateOnMount` `true`; `dedupingInterval: 0` | None (refetches on mount) |
| After a mutation | Optimistic store write (`optimistic: true`); views re-render from the [normalized](https://dataclient.io/docs/concepts/normalization) store | Await mutation response, then `invalidateQueries(['issues'])` (and `['issue']` for multi-view) | Await mutation response, then `mutate()` matching every list key | Await mutation response, then refetch |
| Sorted views | [Query](https://dataclient.io/rest/api/Query) schema (memoized) | `useMemo` + sort | `useMemo` + sort | `useMemo` + sort |

Neither TanStack Query nor SWR is configured with optimistic updates (`onMutate` / `setQueryData`)
or with detail queries seeded from list data (`initialData`). Both are possible, and would narrow
the gap. They require writing each cache update by hand for every query an entity appears in,
which is the work normalization does for you.

See the implementations in
[`src/data-client`](https://github.com/reactive/data-client/blob/fde2da82122096f24b92e789722469271918b5c3/examples/benchmark-react/src/data-client/index.tsx),
[`src/tanstack-query`](https://github.com/reactive/data-client/blob/fde2da82122096f24b92e789722469271918b5c3/examples/benchmark-react/src/tanstack-query/index.tsx),
[`src/swr`](https://github.com/reactive/data-client/blob/fde2da82122096f24b92e789722469271918b5c3/examples/benchmark-react/src/swr/index.tsx) and
[`src/baseline`](https://github.com/reactive/data-client/blob/fde2da82122096f24b92e789722469271918b5c3/examples/benchmark-react/src/baseline/index.tsx).

## What is measured

Each sample is the wall-clock time from triggering an action until a `MutationObserver` sees the
expected change in the DOM. That covers the fetch, cache update, React render and DOM commit.
Data Client's optimistic mutations render before the server replies, so the worker holds their
replies until the window ends; the other libraries wait for the reply inside their windows.
Throughput is reported as operations per second (`1000 / ms`).

### Simulated network

The server answers every request after **40 ms + ⌈records ÷ 20⌉ ms**.
A single entity costs 41 ms, and a 1,000-item list costs 90 ms.
Parsing, normalization and rendering are real; only the latency is simulated.
This models a fast connection and makes large refetches cost more than small ones.
All results on this page have the simulation on.
Turning it off removes most of the cost of the extra requests, so we'd expect much smaller gaps,
but no run without it was published.

### Scenarios behind the chart

- **Cached Navigation** (`list-detail-switch-10`): seed a 1,000-issue sorted list (100 rendered),
  then switch to a detail view and back ten times, each time to an issue not yet visited.
  Data Client reads each issue from the list it already stored. TanStack Query and SWR fetch each
  detail; the baseline also refetches the list on every return.
- **Mutations** (`update-entity`): with 1,000 issues stored and 100 rendered, change one issue's title.
- **Scaling (10k)** (`update-user-10000`): with 10,000 issues stored and 100 rendered,
  rename one of the 20 users, who authored 500 of them.

Other scenarios (initial list load, sorted views, create, delete, move, multi-view) are in the
table below. Scenario definitions are in
[`bench/scenarios.ts`](https://github.com/reactive/data-client/blob/fde2da82122096f24b92e789722469271918b5c3/examples/benchmark-react/bench/scenarios.ts).

## Sampling and statistics

- Each library gets a fresh browser context, and each scenario a fresh page load. Libraries run one
  after another, and garbage collection is forced before every scenario, not between its iterations.
- Within that page, the scenario repeats: warmup iterations are discarded, then measured iterations
  continue until the 95% confidence interval falls within a target, or a cap is hit.
  Navigation and list-load iterations clear the library's cache first; mutation iterations reuse
  the mounted list.

  | Scenario size | Warmup iterations (discarded) | Measured samples | Stop when 95% CI within |
  |---|---|---|---|
  | Small (`getlist-100`, `update-entity`, `unshift-item`, `delete-item`, `move-item`) | 40 | 10 to 60 | ±6% |
  | Large (everything else, including navigation and 10k scaling) | 25 | 10 to 50 | ±10% |

- Outliers beyond 1.5× the interquartile range are trimmed. The result is the median of the rest.
  The margin is Student's t critical value times a robust standard error (scaled median absolute
  deviation ÷ √n).
- The number of samples each scenario took before stopping was not saved, only the bounds above.

## Results

Median operations per second, higher is better. The ± value is the 95% CI margin as a percentage
of the median. Each value is the median of two runs, and each margin the mean of their margins.
Time per operation is `1000 ÷ ops/s`.

| Scenario | Data Client | TanStack Query | SWR | Baseline |
|---|---:|---:|---:|---:|
| **Navigation** | | | | |
| `getlist-100` | 21.12 ± 0.5% | 21.36 ± 0.3% | 21.34 ± 0.3% | 21.37 ± 0.2% |
| `getlist-500` | 13.70 ± 0.4% | 13.88 ± 0.7% | 13.89 ± 0.4% | 13.89 ± 0.5% |
| `getlist-500-sorted` | 13.50 ± 0.4% | 13.75 ± 0.7% | 13.73 ± 0.6% | 13.76 ± 0.4% |
| `list-detail-switch-10` | 47.22 ± 9.7% | 2.24 ± 0.7% | 2.21 ± 1.1% | 0.74 ± 0.2% |
| **Mutations** | | | | |
| `update-entity` | 1367.15 ± 5.7% | 7.33 ± 0.3% | 7.29 ± 0.2% | 7.42 ± 0.2% |
| `update-user` | 1442.51 ± 11.1% | 7.33 ± 0.4% | 7.45 ± 0.3% | 7.45 ± 0.3% |
| `update-entity-sorted` | 829.49 ± 5.0% | 7.31 ± 0.3% | 7.28 ± 0.4% | 7.40 ± 0.3% |
| `update-entity-multi-view` | 837.74 ± 7.8% | 7.33 ± 0.4% | 7.29 ± 0.3% | 7.44 ± 0.3% |
| `unshift-item` | 598.18 ± 5.8% | 7.32 ± 0.2% | 7.42 ± 0.2% | 7.42 ± 0.2% |
| `delete-item` | 860.68 ± 5.3% | 7.29 ± 0.3% | 7.39 ± 0.3% | 7.38 ± 0.3% |
| `move-item` | 542.07 ± 6.0% | 7.13 ± 0.7% | 7.34 ± 0.3% | 7.33 ± 0.5% |
| **Scaling** | | | | |
| `update-user-10000` | 174.04 ± 4.4% | 1.60 ± 0.3% | 1.66 ± 0.2% | 1.65 ± 0.2% |

### Chart values

The chart shows Data Client ÷ baseline for one scenario per group.

| Chart group | Scenario | Data Client | TanStack Query | SWR | Data Client vs TanStack Query | Data Client vs SWR |
|---|---|---:|---:|---:|---:|---:|
| Cached Navigation | `list-detail-switch-10` | 21.2 ms (63.8×) | 446 ms (3.03×) | 452 ms (2.99×) | 21.1× | 21.4× |
| Mutations | `update-entity` | 0.73 ms (184.3×) | 136 ms (0.99×) | 137 ms (0.98×) | 186.5× | 187.5× |
| Scaling (10k) | `update-user-10000` | 5.7 ms (105.5×) | 625 ms (0.97×) | 602 ms (1.01×) | 108.8× | 104.8× |

Baseline times were 1,351 ms, 135 ms and 606 ms. Navigation times cover all ten round trips.

Across the seven mutation scenarios, Data Client ranged from **74×** (`move-item`) to **194×**
(`update-user`) faster than the baseline. On the initial list loads, all four libraries were
within 2% of each other.

## How to read these numbers

- Absolute numbers depend on the machine. The ratios between libraries are what carry over.
- The large ratios mostly measure requests avoided, not faster JavaScript. If your app rarely shows
  the same entity in more than one place, or doesn't mutate shared data, expect a much smaller
  difference.
- The benchmarks are maintained by the Data Client project and have not been independently
  reproduced.
- CI runs only the Data Client scenarios, to catch regressions over time
  ([history](https://reactive.github.io/data-client/react-bench/)). The library comparison runs locally.

## Reproduce it

You need Node 22.18+ or 24.11+ and a Linux, macOS or WSL machine that can run Playwright's Chromium.

```bash
git clone https://github.com/reactive/data-client.git
cd data-client
# Optional: match the published run's code and versions
git checkout fde2da82122096f24b92e789722469271918b5c3
yarn install
yarn build:benchmark-react
yarn workspace example-benchmark-react preview &
sleep 5 # wait for the preview server
cd examples/benchmark-react
env -u CI yarn bench --network-sim true
```

The runner prints JSON results; open `bench/report-viewer.html` to compare runs.
Flags such as `--lib` and `--scenario` narrow the run; see
[Running locally](./README.md#running-locally).
To try your own workload, edit the fixtures in `src/shared/data.ts` or add a scenario to
`bench/scenarios.ts`; the [README](./README.md)
covers adding scenarios and libraries.

## Normalization benchmarks

The [denormalization chart](https://dataclient.io/docs/concepts/performance#normalization-benchmarks) comes from the Node suite in
[`examples/benchmark`](../benchmark)
(`yarn workspace example-benchmark start normalizr`, and `old-normalizr` for the comparison).
It shows Data Client ÷ normalizr: single entity 6.3× (29.9× with the memo cache), large list 1.7× (11.5× cached).
The run behind those values was not recorded in the repo. The suite's README lists a similar run on a
Ryzen 9 7950X with Node 22.14.0.
