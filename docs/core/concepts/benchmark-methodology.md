---
title: Benchmark Methodology
sidebar_label: Benchmark methodology
description: Hardware, library versions, configuration, sample counts, variance and raw timings behind the React rendering benchmarks.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

The full details behind the [React rendering benchmarks](./performance.md#react-rendering-benchmarks):
the machine, versions, how each library is configured, how samples are taken, and every
number the charts were drawn from. The source lives in
[`examples/benchmark-react`](https://github.com/reactive/data-client/tree/master/examples/benchmark-react),
so you can run it yourself, change it, or point it at your own workload.

## Summary

- The charts come from one local run on **2026-03-22** at commit
  [`57b2f97`](https://github.com/reactive/data-client/commit/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05).
- Each simulated request costs **40 ms + 1 ms per 20 records**.
  Most of the gap comes from requests Data Client doesn't wait for or repeat:
  - Navigation renders detail views from entities already in the list response.
  - Mutations update the store [optimistically](../getting-started/mutations.md) in one write.
  - The other libraries wait for the mutation response, then invalidate and refetch.
- Ratios on the [Performance page](./performance.md) are relative to the plain React baseline.
  Against TanStack Query and SWR directly, navigation is **10.6x** and **10.9x**, and the
  `update-entity` mutation is **95.5x** and **94x**.

## Environment

| | |
|---|---|
| Date | 2026-03-22 |
| Commit | [`57b2f97`](https://github.com/reactive/data-client/commit/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05) |
| CPU | AMD Ryzen 9 7950X |
| Memory | 64 GB |
| OS | Ubuntu on WSL2 (Windows host) |
| Node | 24.12.0 |
| Browser | Headless Chromium bundled with Playwright 1.58.2 |
| CPU throttling | None |
| Build | Webpack production build with React Compiler enabled for all four apps |

The run was on a developer workstation, not an isolated machine. The exact Chromium version and
WSL kernel were not recorded. The runner and dependencies have changed since; the charts have not been
re-measured. See the [current README](https://github.com/reactive/data-client/tree/master/examples/benchmark-react#methodology)
for how the benchmark runs today.

### Library versions

| Library | Version |
|---|---|
| `@data-client/react` | Workspace source at the commit above (0.15.7) |
| `@tanstack/react-query` | 5.62.7 |
| `swr` | 2.4.1 |
| `react` / `react-dom` | 19.2.3 |

## How each library is configured

All four apps render the same presentational components (`src/shared/components.tsx`), using the same
GitHub-issue-shaped fixtures, and talk to the same in-memory server running in a Web Worker.
Each app only wires its own data layer, following that library's documented patterns.

| | Data Client | TanStack Query | SWR | Baseline |
|---|---|---|---|---|
| Reads | `useSuspense` / `useDLE` on [resource()](/rest/api/resource) endpoints | `useQuery` | `useSWR` | `useEffect` + `useState` |
| Cache config | `dataExpiryLength: Infinity`; GC sweep disabled during timing | `staleTime: Infinity`, `gcTime: Infinity` | `revalidateOnFocus`, `revalidateOnReconnect`, `revalidateIfStale` `false`; `revalidateOnMount` `true`; `dedupingInterval: 0` | None (refetches on mount) |
| After a mutation | Optimistic store write (`optimistic: true`); views re-render from the [normalized](./normalization.md) store | Await mutation response, then `invalidateQueries(['issues'])` (and `['issue']` for multi-view) | Await mutation response, then `mutate()` matching every list key | Await mutation response, then refetch |
| Sorted views | [Query](/rest/api/Query) schema (memoized) | `useMemo` + sort | `useMemo` + sort | `useMemo` + sort |

Neither TanStack Query nor SWR is configured with optimistic updates (`onMutate` / `setQueryData`)
or with detail queries seeded from list data (`initialData`). Both are possible, and would narrow
the gap. They require writing each cache update by hand for every query an entity appears in,
which is the work normalization does for you.

See the implementations in
[`src/data-client`](https://github.com/reactive/data-client/blob/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05/examples/benchmark-react/src/data-client/index.tsx),
[`src/tanstack-query`](https://github.com/reactive/data-client/blob/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05/examples/benchmark-react/src/tanstack-query/index.tsx),
[`src/swr`](https://github.com/reactive/data-client/blob/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05/examples/benchmark-react/src/swr/index.tsx) and
[`src/baseline`](https://github.com/reactive/data-client/blob/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05/examples/benchmark-react/src/baseline/index.tsx).

## What is measured

Each sample is the wall-clock time from triggering an action until a `MutationObserver` sees the
expected change in the DOM. That covers the fetch, cache update, React render and DOM commit.
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
[`bench/scenarios.ts`](https://github.com/reactive/data-client/blob/57b2f975c81e9fa9d4d9d2f36dbc93e719549e05/examples/benchmark-react/bench/scenarios.ts).

## Sampling and statistics

- Each library gets a fresh browser context, and each scenario a fresh page load. Libraries run one
  after another, and garbage collection is forced before every scenario and every 15 iterations.
- Within that page, the scenario repeats: warmup iterations are discarded, then measured iterations
  continue until the 95% confidence interval falls within a target, or a cap is hit.
  Navigation and list-load iterations clear the library's cache first; mutation iterations reuse
  the mounted list.

  | Scenario size | Warmup iterations (discarded) | Measured samples | Stop when 95% CI within |
  |---|---|---|---|
  | Small (`getlist-100`, `update-entity`, `unshift-item`, `delete-item`, `move-item`) | 5 | 5 to 50 | ±8% |
  | Large (everything else, including navigation and 10k scaling) | 3 | 5 to 40 | ±12% |

- Outliers beyond 1.5× the interquartile range are trimmed. The result is the median of the rest.
  The margin is Student's t critical value times a robust standard error (scaled median absolute
  deviation ÷ √n).
- The number of samples each scenario took before stopping was not saved, only the bounds above.

## Results

Median operations per second, higher is better. The ± value is the 95% CI margin as a percentage
of the median. Time per operation is `1000 ÷ ops/s`.

| Scenario | Data Client | TanStack Query | SWR | Baseline |
|---|---:|---:|---:|---:|
| **Navigation** | | | | |
| `getlist-100` | 20.45 ± 2.3% | 20.62 ± 0.8% | 20.73 ± 0.2% | 20.73 ± 0.5% |
| `getlist-500` | 12.53 ± 2.8% | 12.80 ± 0.2% | 12.71 ± 0.3% | 12.84 ± 0.2% |
| `getlist-500-sorted` | 12.92 ± 5.1% | 12.93 ± 1.1% | 12.90 ± 0.7% | 13.16 ± 3.6% |
| `list-detail-switch-10` | 17.38 ± 8.7% | 1.64 ± 1.7% | 1.59 ± 1.4% | 0.73 ± 0.1% |
| **Mutations** | | | | |
| `update-entity` | 666.67 ± 9.0% | 6.98 ± 0.4% | 7.09 ± 0.4% | 7.23 ± 0.8% |
| `update-user` | 801.28 ± 9.4% | 7.04 ± 0.5% | 7.18 ± 0.1% | 7.24 ± 1.3% |
| `update-entity-sorted` | 625.00 ± 10.8% | 7.10 ± 0.0% | 7.10 ± 1.2% | 7.29 ± 0.9% |
| `update-entity-multi-view` | 645.83 ± 7.6% | 7.14 ± 0.2% | 7.16 ± 0.1% | 7.29 ± 0.3% |
| `unshift-item` | 465.37 ± 3.6% | 6.90 ± 0.4% | 7.18 ± 0.2% | 7.21 ± 0.3% |
| `delete-item` | 833.33 ± 6.0% | 6.93 ± 0.1% | 7.17 ± 0.7% | 7.19 ± 0.7% |
| `move-item` | 333.33 ± 8.9% | 6.76 ± 0.6% | 6.99 ± 0.3% | 6.97 ± 0.2% |
| **Scaling** | | | | |
| `update-user-10000` | 144.93 ± 1.7% | 1.49 ± 0.6% | 1.56 ± 1.7% | 1.56 ± 1.5% |

### Chart values

The chart shows Data Client ÷ baseline for one scenario per group.

| Chart group | Scenario | Data Client | TanStack Query | SWR | Data Client vs TanStack Query | Data Client vs SWR |
|---|---|---:|---:|---:|---:|---:|
| Cached Navigation | `list-detail-switch-10` | 57.5 ms (23.8×) | 610 ms (2.25×) | 629 ms (2.18×) | 10.6× | 10.9× |
| Mutations | `update-entity` | 1.5 ms (92.2×) | 143 ms (0.97×) | 141 ms (0.98×) | 95.5× | 94.0× |
| Scaling (10k) | `update-user-10000` | 6.9 ms (92.9×) | 671 ms (0.96×) | 641 ms (1.00×) | 97.3× | 92.9× |

Baseline times were 1,370 ms, 138 ms and 641 ms. Navigation times cover all ten round trips.

Across the seven mutation scenarios, Data Client ranged from **48×** (`move-item`) to **116×**
(`delete-item`) faster than the baseline. On the initial list loads, all four libraries were
within 3% of each other.

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

You need Node 22+ and a Linux, macOS or WSL machine that can run Playwright's Chromium.

```bash
git clone https://github.com/reactive/data-client.git
cd data-client
# Optional: match the published run's code and versions
git checkout 57b2f975c81e9fa9d4d9d2f36dbc93e719549e05
yarn install
yarn build:benchmark-react
yarn workspace example-benchmark-react preview &
sleep 5 # wait for the preview server
cd examples/benchmark-react
env -u CI yarn bench --network-sim true
```

The runner prints JSON results; open `bench/report-viewer.html` to compare runs.
Flags such as `--lib` and `--scenario` narrow the run; see
[Running locally](https://github.com/reactive/data-client/tree/master/examples/benchmark-react#running-locally).
To try your own workload, edit the fixtures in `src/shared/data.ts` or add a scenario to
`bench/scenarios.ts`; the [README](https://github.com/reactive/data-client/tree/master/examples/benchmark-react)
covers adding scenarios and libraries.

## Normalization benchmarks

The [denormalization chart](./performance.md#normalization-benchmarks) comes from the Node suite in
[`examples/benchmark`](https://github.com/reactive/data-client/tree/master/examples/benchmark)
(`yarn workspace example-benchmark start normalizr`, and `old-normalizr` for the comparison).
It shows Data Client ÷ normalizr: single entity 6.3× (29.9× with the memo cache), large list 1.7× (11.5× cached).
The run behind those values was not recorded in the repo. The suite's README lists a similar run on a
Ryzen 9 7950X with Node 22.14.0.
