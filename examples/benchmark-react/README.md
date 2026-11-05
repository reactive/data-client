# React Rendering Benchmark

Browser-based benchmark for `@data-client/react` measuring mount/update scenarios. Includes TanStack Query, SWR, and a plain-React baseline for reference. Built with Webpack via `@anansi/webpack-config`. Results are reported to CI via `rhysd/github-action-benchmark`.

## Comparison to Node benchmarks

The repo has two benchmark suites:

- **`examples/benchmark`** (Node) — Measures the JS engine only: `normalize`/`denormalize`, `Controller.setResponse`/`getResponse`, reducer throughput. No browser, no React. Use it to validate core and normalizr changes.
- **`examples/benchmark-react`** (this app) — Measures the full React rendering pipeline: same operations driven in a real browser, with real React renders and DOM updates. Use it to validate `@data-client/react` changes; other libraries are included for reference.

## Methodology

- **What we measure:** Wall-clock time from triggering an action (e.g. `init(100)` or `updateUser('user0')`) until a MutationObserver detects the expected DOM change in the benchmark container. Two scenarios sum several windows instead: the ticker stream (one per message) and `list-detail-switch-10` (one per step). The runner waits for the result inside the page, so it sends nothing to the page while an action is timed. Optionally we also record React Profiler commit duration and, with `BENCH_TRACE=true`, Chrome trace duration.
- **Timer resolution:** `yarn preview` serves the apps with COOP/COEP headers (`serve.json`). The page is then cross-origin isolated, so `performance.now()` resolves to 5 µs instead of 0.1 ms. The runner fails on a page that is not isolated.
- **Simulated server:** The server caches each issue's JSON, so building a list reply costs almost nothing; the client still parses every reply. data-client commits its mutations optimistically, before the server replies, so the worker holds mutation replies until each data-client update window ends. Without the hold, a reply that reached the main thread before React rendered was processed inside the window (in CI there is no simulated latency). The other libraries wait for the reply inside their windows, so their replies are never held.
- **Why:** Scenarios are chosen to exercise areas where caching strategies differ: shared-entity updates, referential stability, and derived-view memoization. See [js-framework-benchmark "How the duration is measured"](https://github.com/krausest/js-framework-benchmark/wiki/How-the-duration-is-measured) for a similar timeline-based approach.
- **Statistical:** Warmup runs are discarded; we report median and 95% CI (as percentage of median). Timing scenarios (navigation and mutation) use **convergent mode**: a single page load per scenario, with warmup iterations followed by adaptive measurement iterations where each iteration produces one sample and convergence is checked inline. This eliminates page-reload overhead between samples for faster, lower-variance results. Deterministic scenarios (ref-stability) run once. Memory scenarios use a separate outer loop with a fresh page per round.
- **No CPU throttling:** Runs at native speed with more samples for statistical significance rather than artificial slowdown. Convergent timing scenarios use 40 warmup + up to 60 measurement iterations (small) or 25 warmup + up to 50 (large); short windows keep getting faster for about 30 iterations as V8 optimizes. Garbage collection is forced before each scenario, not between its iterations: a forced collection made the next few iterations up to 3× slower. Early stopping triggers when 95% CI margin drops below the target percentage (2% small / 3% large in CI). CI pins the benchmark to dedicated CPU cores via `taskset` to reduce scheduling noise.

## Comparison philosophy

The primary purpose is to track data-client's own performance — catch regressions and validate improvements. Other libraries are included for context; CI runs data-client only.

Scenarios are designed to isolate the data framework layer: fetching, caching, update propagation, and rendering in response to data changes. Real-world applications will have additional performance considerations (routing, animation, third-party scripts, etc.) beyond what is measured here.

All implementations share presentational components, fixture data, fetch functions, and the `useBenchState` harness. They only diverge where each library's data layer requires it, using idiomatic patterns from that library's documentation. No implementation builds custom state management on top of its library.

## Scenario categories

- **Hot path (in CI, data-client only)** — JS-only: init (fetch + render), update propagation, ref-stability, sorted-view. No simulated network. CI runs only data-client scenarios to track regressions; other libraries are benchmarked locally.
- **With network (local)** — Same shared-author update but with simulated network delay (consistent ms per "request"). Normalized caches propagate via a single store update; query-keyed caches invalidate and refetch affected queries. **Not run in CI** — run locally with `yarn bench` (no `CI` env) to include these.
- **Memory (local only)** — Heap delta after repeated mount/unmount cycles.
- **Startup (local only)** — FCP and task duration via CDP `Performance.getMetrics`.

## Scenarios

**Hot path (CI)**

- **Get list** (`getlist-100`, `getlist-500`) — Time to show a ListView component that auto-fetches 100 or 500 issues from the list endpoint, then renders (unit: ops/s). Exercises the full fetch + normalization + render pipeline.
- **Get list sorted** (`getlist-500-sorted`) — Mount 500 issues through a sorted/derived view. data-client uses `useQuery(sortedIssuesQuery)` with `Query` schema memoization; other libraries use `useMemo` + sort.
- **Update entity** (`update-entity`) — Time to update one issue and propagate to the UI (unit: ops/s).
- **Update entity sorted** (`update-entity-sorted`) — After mounting a sorted view, update one entity. data-client's `Query` memoization avoids re-sorting when sort keys are unchanged.
- **Update entity multi-view** (`update-entity-multi-view`) — Update one issue that appears simultaneously in a list, a detail panel, and a pinned-cards strip. Normalized caches propagate via a single store write; query-keyed caches invalidate and refetch each query.
- **Update user (scaling)** (`update-user`, `update-user-10000`) — Rename one shared user with 1,000 or 10,000 issues stored and 100 rendered, to test how updates scale with store size.
- **Ref-stability** (`ref-stability-issue-changed`, `ref-stability-user-changed`) — Count of components that received a **new** object reference after an update (unit: count; smaller is better).
- **List-detail switch** (`list-detail-switch-10`) — Mount a 1,000-issue sorted list (100 rendered), then switch to an issue's detail view and back ten times. Each step is timed from its state change until the commit that shows the next view; a loading state does not end the step. The runner reports the sum of the 20 steps. The time between steps is not timed.
- **Invalidate and resolve** (`invalidate-and-resolve`) — data-client only; invalidates a cached endpoint and immediately re-resolves. Measures Suspense boundary round-trip.
- **Ticker stream** (`update-ticker-stream`) — data-client only. This models a websocket feed. The store holds 500 tickers and the 1,000-issue list (100 rendered). A strip renders 20 tickers, and each `TickerCard` reads its ticker with `useQuery(TickerEntity, { symbol })`. The harness sends 200 messages. Each message applies 10 ticker updates with one `ctrl.set([TickerEntity], batch)`: 2 rendered tickers, which rotate through the strip so each one updates about 20 times, and 8 of the 480 tickers the strip does not render.
  - **What is timed:** each message has its own window. The window starts right before `ctrl.set()` and ends at the first DOM mutation after it, which is React's commit of that message (the same window as the other update scenarios). The harness records one `stream-message` measure per window, and the runner reports their sum.
  - **What is not timed:** building the batches, which happens before the first message, React's passive-effect scheduling, and the time between messages. The harness posts the next message through a `MessageChannel` only after the `ctrl.set()` promise resolves, which happens in `DataStore`'s effect after the commit. So each message runs in a new task and gets its own render.
  - **What the number shows today:** each `ctrl.set()` wakes every store consumer. All 20 `TickerCard`s (`useQuery`) and the `ListView` (`useDLE`) re-render, because `useCacheState` reads the whole store state from context. React Compiler then skips each `IssueRow` whose issue reference did not change. So this is a baseline: a future per-entity subscription, which re-renders only the changed tickers, would show as a faster time.
- **Ticker stream worst and p95 message** (`update-ticker-stream-worst-message`, `update-ticker-stream-p95-message`) — The longest window and the 95th-percentile window from the same iterations (the runner computes both from the `stream-message` measures; p95 is the same percentile the runner uses everywhere). These show stutter: one slow message that the sum hides. They use ops/s (1000 ÷ ms) like the other timings, so bigger is better. They run locally and not in CI: one message per iteration decides each, so they vary by about ±7% (p95) and ±14% (worst), more than CI's 3% target.
- **Ticker stream row renders** (`ticker-stream-issue-row-renders`) — Count of `IssueRow` renders during the ticker stream (unit: count; expected 0). In the React Compiler build, the issue list keeps its reference, so no row re-renders. This count is deterministic, so it runs locally and not in CI.

**With network (local comparison)**

- **Update shared user with network** (`update-shared-user-with-network`) — Same as above with a simulated delay (e.g. 50 ms) per "request."

**Memory (local only)**

- **Memory mount/unmount cycle** (`memory-mount-unmount-cycle`) — Mount 500 issues, unmount, repeat 10 times; report JS heap delta (bytes) via CDP. Surfaces leaks or unbounded growth.

**Startup (local only)**

- **Startup FCP** (`startup-fcp`) — First Contentful Paint time via CDP `Performance.getMetrics`.
- **Startup task duration** (`startup-task-duration`) — Total main-thread task duration via CDP (proxy for TBT).

## Expected results

Illustrative **relative** results with **baseline = 100%** (plain React useState/useEffect, no data library). For **throughput** rows, each value is (library ops/s ÷ baseline ops/s) × 100 — **higher is faster**. For **ref-stability** rows, the ratio uses the “refs changed” count — **lower is fewer components that saw a new object reference**. Figures are rounded from the **Latest measured results** table below (network simulation on); absolute ops/s will vary by machine, but **library-to-library ratios** are usually similar.

| Category | Scenarios (representative) | data-client | tanstack-query | swr | baseline |
|---|---|---:|---:|---:|---:|
| Navigation | `getlist-100`, `getlist-500`, `getlist-500-sorted` | ~99% | **~100%** | **~100%** | **100%** |
| Navigation | `list-detail-switch-10` | **~6381%** | ~302% | ~299% | 100% |
| Mutations | `update-entity`, `update-user`, `update-entity-sorted`, `update-entity-multi-view`, `unshift-item`, `delete-item`, `move-item` | **~12484%** | ~99% | ~99% | 100% |
| Scaling (10k items) | `update-user-10000` | **~10516%** | ~97% | ~100% | 100% |


## Latest measured results (network simulation on)

Median ops/s per scenario; range is approximate 95% CI margin from the runner (`stats.ts`). **Network simulation** uses response-size-based delays (`NETWORK_SIM_CONFIG` in `bench/scenarios.ts`: 40 ms base latency + 1 ms per 20 records) so list refetches after an author update pay extra latency compared to normalized propagation.

Run: **2026-11-05**, Linux (WSL2), `yarn build:benchmark-react`, `yarn preview` + `env -u CI npx tsx bench/runner.ts --network-sim true`, twice (all libraries; memory scenarios not included). Each value is the median of the two runs; each range is the mean of their margins. Numbers are **machine-specific**; use them for relative comparison between libraries, not as absolutes.

This run used master after [#4580](https://github.com/reactive/data-client/pull/4580) (TanStack Query 5.96.2, SWR 2.5.1, React 19.3.1) with the current convergent settings: 40 warmup + 10–60 samples at ±6% (small), 25 warmup + 10–50 samples at ±10% (large). The charts on the docs site come from this run; [Benchmark methodology](./METHODOLOGY.md) has the details.

| Scenario | data-client | tanstack-query | swr | baseline |
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
| `update-user-10000` | 174.04 ± 4.4% | 1.60 ± 0.3% | 1.66 ± 0.2% | 1.65 ± 0.2% |
| `unshift-item` | 598.18 ± 5.8% | 7.32 ± 0.2% | 7.42 ± 0.2% | 7.42 ± 0.2% |
| `delete-item` | 860.68 ± 5.3% | 7.29 ± 0.3% | 7.39 ± 0.3% | 7.38 ± 0.3% |
| `move-item` | 542.07 ± 6.0% | 7.13 ± 0.7% | 7.34 ± 0.3% | 7.33 ± 0.5% |

[Measured on a Ryzen 9 7950X; 64 GB RAM; Ubuntu (WSL2); Node 26.12.1; Chromium (Playwright 1.64.0)]

## Expected variance

| Category | Scenarios | Typical run-to-run spread |
|---|---|---|
| **Stable** | `getlist-*`, `update-entity`, `update-entity-sorted`, `ref-stability-*` | <2% |
| **Moderate** | `update-user-*`, `update-entity-multi-view`, `list-detail-switch-10`, `move-item` | 2-4% |
| **Volatile** | `memory-mount-unmount-cycle`, `startup-*`, `(react commit)` suffixes | 5-15% |

CI convergence targets: 2% (small scenarios), 3% (large scenarios). Reported margins should not exceed 5%. Regressions >5% on stable scenarios or >10% on moderate scenarios are worth investigating.

## Interpreting results

- **Higher is better** for throughput (ops/s). **Lower is better** for ref-stability counts and heap delta (bytes).
- **Ref-stability:** `issueRefChanged` and `userRefChanged` count how many components received a new object reference. Normalized caches preserve referential equality for unchanged entities; query-keyed caches typically create new references on each cache write.
- **Row renders:** `issueRowRenders` counts `IssueRow` renders and `listViewRenders` counts `ListView` renders, from `getRenderCounts()` since the last `resetRenderCounts()`. Updates to unrelated entities, such as the ticker stream, should not re-render any row.
- **React commit:** Reported as `(react commit)` suffix entries. These measure React Profiler `actualDuration`: the time React spends rendering the changed components. React calls the Profiler only in a profiling build (`yarn build --env profile`), so the default build reports no `(react commit)` entries. Even in a profiling build, store updates that re-render only components inside the harness (for example `update-entity` and the ticker stream) produce no Profiler callback here, so those scenarios report no entry. Scenarios report the last commit in the iteration.
- **Report viewer:** Toggle the "Base metrics", "React commit", and "Trace" checkboxes to filter the comparison table. Use "Load history" to compare multiple runs over time.

## Reading the CI comment

The "Benchmark React", "Benchmark", and "Benchmark Spread" PR comments compare one GitHub runner against the last master run on another, so runner speed alone can shift a whole run by up to ~1.7×. The thresholds above and the comment's ± ranges hold only within one machine.

| Comment shows | Do |
|---|---|
| Every suite shifts together, React and Node comments disagree, or "Build packages" time moved with the scores | Treat as runner noise |
| Only suites on code the PR changes shift | Run an A/B |

A/B: build base and PR in separate worktrees (`yarn build:benchmark-react` or `yarn build:benchmark`); for React, serve each with `BENCH_PORT=<port> yarn workspace example-benchmark-react preview`. Alternate base and PR for 5+ rounds (`CI=true BENCH_PORT=<port> yarn bench` or `yarn workspace example-benchmark start <suite> [filter]`) and compare medians; interleaving cancels machine drift.

The path filter skips `packages/rest/src` and most of `packages/endpoint/src`, so for changes there the stored baseline may predate master.

## Adding a new library

1. Add a new app under `src/<lib>/index.tsx` (e.g. `src/urql/index.tsx`).
2. Implement the `BenchAPI` interface on `window.__BENCH__`: `init`, `updateEntity`, `updateUser`, `unmountAll`, `getRenderedCount`, `captureRefSnapshot`, `getRefStabilityReport`, and optionally `mountUnmountCycle`, `mountSortedView`. Use the shared presentational `IssuesRow` from `@shared/components` and fixtures from `@shared/data`. The harness (`useBenchState`) provides default `init`, `unmountAll`, `mountUnmountCycle`, `getRenderedCount`, and ref-stability and render-count methods; libraries only need to supply `updateEntity`, `updateUser`, and any overrides. If every update the library times with `measureUpdate` commits before the server replies (optimistic updates), call `useBenchState({ optimisticMutations: true })`.
3. Add the library to `LIBRARIES` in `bench/scenarios.ts`.
4. Add a webpack entry in `webpack.config.cjs` for the new app and an `HtmlWebpackPlugin` entry so the app is served at `/<lib>/`.
5. Add the dependency to `package.json` and run `yarn install`.

## Running locally

1. **Install system dependencies (Linux / WSL)**
   Playwright needs system libraries to run Chromium. If you see "Host system is missing dependencies to run browsers":

   ```bash
   sudo env PATH="$PATH" npx playwright install-deps chromium
   ```

   The `env PATH="$PATH"` is needed because `sudo` doesn't inherit your shell's PATH (where nvm-managed node/npx live).

2. **Build and run**

   ```bash
   yarn build:benchmark-react
   yarn workspace example-benchmark-react preview &
   sleep 5
   cd examples/benchmark-react && yarn bench
   ```

   Or from repo root after a build: start preview in one terminal, then in another run `yarn workspace example-benchmark-react bench`.

3. **Without React Compiler**

   The default build includes React Compiler. To measure impact without it:

   ```bash
   cd examples/benchmark-react
   yarn build:no-compiler     # builds without babel-plugin-react-compiler
   yarn preview &
   sleep 5
   yarn bench:no-compiler     # labels results with [no-compiler] suffix
   ```

   Or as a single command: `yarn bench:run:no-compiler`.

   Results are labelled `[no-compiler]` so you can compare side-by-side with the default run by loading both JSON files into the report viewer's history feature.

   Env vars for custom combinations:
   - `REACT_COMPILER=false` — disables the Babel plugin at build time
   - `BENCH_LABEL=<tag>` — appends `[<tag>]` to all result names at bench time
   - `BENCH_PORT=<port>` — port for `preview` server and bench runner (default `5173`)
   - `BENCH_BASE_URL=<url>` — full base URL override (takes precedence over `BENCH_PORT`)

4. **Filtering scenarios**

   The runner supports CLI flags (with env var fallbacks) to select a subset of scenarios:

   | CLI flag | Env var | Description |
   |---|---|---|
   | `--lib <names>` | `BENCH_LIB` | Comma-separated library names (e.g. `data-client,swr`) |
   | `--size <small\|large>` | `BENCH_SIZE` | Run only `small` (cheap, full rigor) or `large` (expensive, reduced runs) scenarios |
   | `--action <group\|action>` | `BENCH_ACTION` | Filter by action group (`mount`, `update`, `mutation`, `memory`) or exact action name. Memory is **not run by default**; use `--action memory` to include. |
   | `--scenario <pattern>` | `BENCH_SCENARIO` | Substring filter on scenario name |

   CLI flags take precedence over env vars. Examples:

   ```bash
   yarn bench --lib data-client                # only data-client
   yarn bench --size small                      # only cheap scenarios (full warmup/measurement)
   yarn bench --action mount                    # init, mountSortedView
   yarn bench --action memory                   # memory-mount-unmount-cycle (heap delta; opt-in category)
   yarn bench --action update --lib swr         # update scenarios for swr only
   yarn bench --scenario sorted-view            # only sorted-view scenarios
   ```

   Convenience scripts:

   ```bash
   yarn bench:small       # --size small
   yarn bench:large       # --size large
   yarn bench:dc          # --lib data-client
   ```

5. **Scenario sizes**

   Scenarios are classified as `small` or `large` based on their cost:

   - **Small** (convergent: 8 warmup + 10–60 measurement iterations): `getlist-100`, `update-entity`, `invalidate-and-resolve`, `unshift-item`, `delete-item`
   - **Small** (deterministic, single run): `ref-stability-*`, `ticker-stream-issue-row-renders`
   - **Large** (convergent: 5 warmup + 10–50 measurement iterations): `getlist-500`, `getlist-500-sorted`, `update-user`, `update-user-10000`, `update-entity-sorted`, `update-entity-multi-view`, `list-detail-switch-10`, `update-ticker-stream` (its `-worst-message` and `-p95-message` entries come from the same iterations and are not reported in CI)
   - **Memory** (opt-in, 1 warmup + 3 measurement rounds): `memory-mount-unmount-cycle` — run with `--action memory`

   Timing scenarios use convergent mode (single page load, inline convergence per scenario). Each group uses its own warmup/measurement config. Use `--size` to run only one group.

## Output

The runner prints a JSON array in `customBiggerIsBetter` format (name, unit, value, range) to stdout. In CI this is written to `react-bench-output.json` and sent to the benchmark action.

To view results locally, open `bench/report-viewer.html` in a browser and paste the JSON (or upload `react-bench-output.json`) to see a comparison table and bar chart.

## Profiling

### Chrome trace (timeline duration)

Set `BENCH_TRACE=true` when running the bench to enable Chrome tracing for duration scenarios. Trace files are written to disk; parsing and reporting trace duration is best-effort and may require additional tooling for the trace zip format.

### V8 opt/deopt investigation

For the same granularity of V8 optimization investigation available in `examples/benchmark` (Node), two modes pass `--js-flags` to Chromium via Playwright:

```bash
yarn bench:trace    # --trace-opt --trace-deopt → v8-trace.log
yarn bench:deopt    # --prof → v8-logs/v8-<pid>.log
```

Both default to `--lib data-client --size small` for focused, fast investigation. Add other flags as needed (e.g. `--scenario update-entity`).

**`bench:trace`** (`BENCH_V8_TRACE=true`) launches Chromium with `--js-flags="--trace-opt --trace-deopt"`. The runner uses Playwright `launchServer` (not `launch`) so the root browser process stdout/stderr can be piped to `v8-trace.log` — `Browser` from `launch()` does not expose `process()`. This is the browser equivalent of `examples/benchmark`'s `start:trace` — look for optimization and deoptimization lines for functions of interest.

**`bench:deopt`** (`BENCH_V8_DEOPT=true`) launches Chromium with `--js-flags="--prof"`. V8 writes per-process profiling logs to `v8-logs/v8-<pid>.log`. Chromium is multi-process, so several files are created; the renderer log (typically the largest) contains the benchmark's hot path. Process it with:

```bash
node --prof-process v8-logs/v8-<pid>.log > processed.txt
```

Both env vars can be combined for simultaneous trace output and profiling logs. The convenience scripts can be overridden:

```bash
BENCH_V8_TRACE=true yarn bench --lib data-client --scenario update-entity
BENCH_V8_DEOPT=true yarn bench --lib data-client --size large
```
