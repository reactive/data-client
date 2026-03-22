# React Rendering Benchmark

Browser-based benchmark comparing `@data-client/react`, TanStack Query, and SWR on mount/update scenarios. Built with Webpack via `@anansi/webpack-config`. Results are reported to CI via `rhysd/github-action-benchmark`.

## Comparison to Node benchmarks

The repo has two benchmark suites:

- **`examples/benchmark`** (Node) — Measures the JS engine only: `normalize`/`denormalize`, `Controller.setResponse`/`getResponse`, reducer throughput. No browser, no React. Use it to validate core and normalizr changes.
- **`examples/benchmark-react`** (this app) — Measures the full React rendering pipeline: same operations driven in a real browser, with layout and paint. Use it to validate `@data-client/react` and compare against other data libraries.

## Methodology

- **What we measure:** Wall-clock time from triggering an action (e.g. `init(100)` or `updateUser('user0')`) until a MutationObserver detects the expected DOM change in the benchmark container. Optionally we also record React Profiler commit duration and, with `BENCH_TRACE=true`, Chrome trace duration.
- **Why:** Normalized caching should show wins on shared-entity updates (one store write, many components update), ref stability (fewer new object references), and derived-view memoization (`Query` schema avoids re-sorting when entities haven't changed). See [js-framework-benchmark "How the duration is measured"](https://github.com/krausest/js-framework-benchmark/wiki/How-the-duration-is-measured) for a similar timeline-based approach.
- **Statistical:** Warmup runs are discarded; we report median and 95% CI (as percentage of median). Libraries are interleaved per round to reduce environmental variance. Each round runs 5 sub-iterations per page visit and reports the median, further reducing per-sample noise.
- **No CPU throttling:** Runs at native speed with more samples for statistical significance rather than artificial slowdown. Small (cheap) scenarios use 2 warmup + up to 12 measurement rounds locally; large (expensive) scenarios use 1 warmup + up to 6 measurement rounds. Early stopping triggers when 95% CI margin drops below the target percentage.

## Scenario categories

- **Hot path (in CI, data-client only)** — JS-only: init (fetch + render), update propagation, ref-stability, sorted-view. No simulated network. CI runs only `data-client` scenarios to track our own regressions; competitor libraries are benchmarked locally for comparison.
- **With network (local comparison)** — Same shared-author update but with simulated network delay (consistent ms per "request"). Used to compare overfetching: data-client needs one store update (1 × delay); non-normalized libs typically invalidate/refetch multiple queries (N × delay). **Not run in CI** — run locally with `yarn bench` (no `CI` env) to include these.
- **Memory (local only)** — Heap delta after repeated mount/unmount cycles.
- **Startup (local only)** — FCP and task duration via CDP `Performance.getMetrics`.

## Scenarios

**Hot path (CI)**

- **Get list** (`getlist-100`, `getlist-500`) — Time to show a ListView component that auto-fetches 100 or 500 issues from the list endpoint, then renders (unit: ops/s). Exercises the full fetch + normalization + render pipeline.
- **Get list sorted** (`getlist-500-sorted`) — Mount 500 issues through a sorted/derived view. data-client uses `useQuery(sortedIssuesQuery)` with `Query` schema memoization; competitors use `useMemo` + sort.
- **Update entity** (`update-entity`) — Time to update one issue and propagate to the UI (unit: ops/s).
- **Update entity sorted** (`update-entity-sorted`) — After mounting a sorted view, update one entity. data-client's `Query` memoization avoids re-sorting when sort keys are unchanged.
- **Update entity multi-view** (`update-entity-multi-view`) — Update one issue that appears simultaneously in a list, a detail panel, and a pinned-cards strip. Exercises cross-query entity propagation: normalized cache updates once and all three views reflect the change; non-normalized libraries must invalidate and refetch each query independently.
- **Update user (scaling)** (`update-user`, `update-user-10000`) — Update one shared user with 1,000 or 10,000 mounted issues to test subscriber scaling. Normalized cache: one store update, all views of that user update.
- **Ref-stability** (`ref-stability-issue-changed`, `ref-stability-user-changed`) — Count of components that received a **new** object reference after an update (unit: count; smaller is better). Normalization keeps referential equality for unchanged entities.
- **Invalidate and resolve** (`invalidate-and-resolve`) — data-client only; invalidates a cached endpoint and immediately re-resolves. Measures Suspense boundary round-trip.

**With network (local comparison)**

- **Update shared user with network** (`update-shared-user-with-network`) — Same as above with a simulated delay (e.g. 50 ms) per "request." data-client propagates via normalization (no extra request); other libs invalidate/refetch the list endpoint.

**Memory (local only)**

- **Memory mount/unmount cycle** (`memory-mount-unmount-cycle`) — Mount 500 issues, unmount, repeat 10 times; report JS heap delta (bytes) via CDP. Surfaces leaks or unbounded growth.

**Startup (local only)**

- **Startup FCP** (`startup-fcp`) — First Contentful Paint time via CDP `Performance.getMetrics`.
- **Startup task duration** (`startup-task-duration`) — Total main-thread task duration via CDP (proxy for TBT).

## Expected results

Illustrative **relative** results with **baseline = 100%** (plain React useState/useEffect, no data library). For **throughput** rows, each value is (library ops/s ÷ baseline ops/s) × 100 — **higher is faster**. For **ref-stability** rows, the ratio uses the “refs changed” count — **lower is fewer components that saw a new object reference**. Figures are rounded from the **Latest measured results** table below (network simulation on); absolute ops/s will vary by machine, but **library-to-library ratios** are usually similar.

| Category | Scenarios (representative) | data-client | tanstack-query | swr | baseline |
|---|---|---:|---:|---:|---:|
| Navigation | `getlist-100`, `getlist-500`, `getlist-500-sorted` | ~98% | ~100% | ~100% | **100%** |
| Navigation | `list-detail-switch-10` | **~1354%** | ~233% | ~260% | 100% |
| Mutations | `update-entity`, `update-user`, `update-entity-sorted`, `update-entity-multi-view`, `unshift-item`, `delete-item`, `move-item` | **~6778%** | ~97% | ~99% | 100% |
| Scaling (10k items) | `update-user-10000` | **~9713%** | ~94% | ~100% | 100% |


## Latest measured results (network simulation on)

Median ops/s per scenario; range is approximate 95% CI margin from the runner (`stats.ts`). **Network simulation** uses response-size-based delays (`NETWORK_SIM_CONFIG` in `bench/scenarios.ts`: 40 ms base latency + 1 ms per 20 records) so list refetches after an author update pay extra latency compared to normalized propagation.

Run: **2026-03-22**, Linux (WSL2), `yarn build:benchmark-react`, static preview + `env -u CI npx tsx bench/runner.ts --network-sim true` (all libraries; memory scenarios not included). Numbers are **machine-specific**; use them for relative comparison between libraries, not as absolutes.

| Scenario | data-client | tanstack-query | swr | baseline |
|---|---:|---:|---:|---:|
| **Navigation** | | | | |
| `getlist-100` | 20.28 ± 0.3% | 20.58 ± 1.2% | 20.58 ± 0.3% | 20.62 ± 0.3% |
| `getlist-500` | 12.41 ± 0.4% | 12.61 ± 0.2% | 12.59 ± 0.2% | 12.63 ± 0.2% |
| `getlist-500-sorted` | 12.55 ± 0.2% | 12.67 ± 1.3% | 12.72 ± 0.4% | 12.79 ± 0.4% |
| `list-detail-switch-10` | 9.75 ± 1.7% | 1.68 ± 0.2% | 1.87 ± 0.9% | 0.72 ± 0.0% |
| **Mutations** | | | | |
| `update-entity` | 555.56 ± 2.9% | 7.00 ± 0.3% | 6.98 ± 0.1% | 7.18 ± 0.2% |
| `update-user` | 625.00 ± 11.2% | 6.95 ± 0.1% | 7.15 ± 0.2% | 7.17 ± 0.2% |
| `update-entity-sorted` | 476.19 ± 0.0% | 7.06 ± 0.3% | 7.06 ± 0.0% | 7.24 ± 0.0% |
| `update-entity-multi-view` | 500.00 ± 3.4% | 7.05 ± 0.2% | 7.09 ± 0.1% | 7.25 ± 0.1% |
| `update-user-10000` | 151.52 ± 2.8% | 1.47 ± 0.0% | 1.56 ± 0.1% | 1.56 ± 0.3% |
| `unshift-item` | 434.78 ± 6.1% | 6.91 ± 0.2% | 7.13 ± 0.2% | 7.15 ± 0.3% |
| `delete-item` | 526.32 ± 2.7% | 6.89 ± 0.0% | 7.13 ± 0.4% | 7.12 ± 0.0% |
| `move-item` | 277.78 ± 3.9% | 6.52 ± 0.2% | 6.98 ± 0.6% | 6.87 ± 0.2% |

[Measured on a Ryzen 9 7950X; 64 GB RAM; Ubuntu (WSL2); Node 24.12.0; Chromium (Playwright)]

## Expected variance

| Category | Scenarios | Typical run-to-run spread |
|---|---|---|
| **Stable** | `getlist-*`, `update-entity`, `ref-stability-*` | 2-5% |
| **Moderate** | `update-user-*`, `update-entity-sorted`, `update-entity-multi-view` | 5-10% |
| **Volatile** | `memory-mount-unmount-cycle`, `startup-*`, `(react commit)` suffixes | 10-25% |

Regressions >5% on stable scenarios or >15% on volatile scenarios are worth investigating.

## Interpreting results

- **Higher is better** for throughput (ops/s). **Lower is better** for ref-stability counts and heap delta (bytes).
- **Ref-stability:** data-client's normalized cache keeps referential equality for unchanged entities, so `issueRefChanged` and `userRefChanged` should stay low. Non-normalized libs typically show higher counts because they create new object references for every cache write.
- **React commit:** Reported as `(react commit)` suffix entries. These measure React Profiler `actualDuration` and isolate React reconciliation cost from layout/paint.
- **Report viewer:** Toggle the "Base metrics", "React commit", and "Trace" checkboxes to filter the comparison table. Use "Load history" to compare multiple runs over time.

## Adding a new library

1. Add a new app under `src/<lib>/index.tsx` (e.g. `src/urql/index.tsx`).
2. Implement the `BenchAPI` interface on `window.__BENCH__`: `init`, `updateEntity`, `updateUser`, `unmountAll`, `getRenderedCount`, `captureRefSnapshot`, `getRefStabilityReport`, and optionally `mountUnmountCycle`, `mountSortedView`. Use the shared presentational `IssuesRow` from `@shared/components` and fixtures from `@shared/data`. The harness (`useBenchState`) provides default `init`, `unmountAll`, `mountUnmountCycle`, `getRenderedCount`, and ref-stability methods; libraries only need to supply `updateEntity`, `updateUser`, and any overrides.
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

   - **Small** (2 warmup + 3–12 measurement): `getlist-100`, `update-entity`, `ref-stability-*`, `invalidate-and-resolve`, `unshift-item`, `delete-item`
   - **Large** (1 warmup + 3–6 measurement): `getlist-500`, `getlist-500-sorted`, `update-user`, `update-user-10000`, `update-entity-sorted`, `update-entity-multi-view`, `list-detail-switch-10`
   - **Memory** (opt-in, 1 warmup + 3 measurement): `memory-mount-unmount-cycle` — run with `--action memory`

   When running all scenarios (`yarn bench`), each group runs with its own warmup/measurement count. Use `--size` to run only one group.

## Output

The runner prints a JSON array in `customBiggerIsBetter` format (name, unit, value, range) to stdout. In CI this is written to `react-bench-output.json` and sent to the benchmark action.

To view results locally, open `bench/report-viewer.html` in a browser and paste the JSON (or upload `react-bench-output.json`) to see a comparison table and bar chart.

## Optional: Chrome trace

Set `BENCH_TRACE=true` when running the bench to enable Chrome tracing for duration scenarios. Trace files are written to disk; parsing and reporting trace duration is best-effort and may require additional tooling for the trace zip format.
