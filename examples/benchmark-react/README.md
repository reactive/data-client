# React Rendering Benchmark

Browser-based benchmark comparing `@data-client/react`, TanStack Query, SWR, and a plain React baseline on mount/update scenarios. Built with Webpack via `@anansi/webpack-config`. Results are reported to CI via `rhysd/github-action-benchmark`.

## Comparison to Node benchmarks

The repo has two benchmark suites:

- **`examples/benchmark`** (Node) — Measures the JS engine only: `normalize`/`denormalize`, `Controller.setResponse`/`getResponse`, reducer throughput. No browser, no React. Use it to validate core and normalizr changes.
- **`examples/benchmark-react`** (this app) — Measures the full React rendering pipeline: same operations driven in a real browser, with layout and paint. Use it to validate `@data-client/react` and compare against other data libraries.

## Methodology

- **What we measure:** Wall-clock time from triggering an action (e.g. `init(100)` or `updateAuthor('author-0')`) until the harness sets `data-bench-complete` (after two `requestAnimationFrame` callbacks). Optionally we also record React Profiler commit duration and, with `BENCH_TRACE=true`, Chrome trace duration.
- **Why:** Normalized caching should show wins on shared-entity updates (one store write, many components update), ref stability (fewer new object references), and derived-view memoization (`Query` schema avoids re-sorting when entities haven't changed). See [js-framework-benchmark "How the duration is measured"](https://github.com/krausest/js-framework-benchmark/wiki/How-the-duration-is-measured) for a similar timeline-based approach.
- **Statistical:** Warmup runs are discarded; we report median and 95% CI. Libraries are interleaved per round to reduce environmental variance.
- **No CPU throttling:** Runs at native speed with more samples for statistical significance rather than artificial slowdown. Small (cheap) scenarios use 3 warmup + 15 measurement runs locally (10 in CI); large (expensive) scenarios use 1 warmup + 4 measurement runs.

## Scenario categories

- **Hot path (in CI, data-client only)** — JS-only: init (fetch + render), update propagation, ref-stability, sorted-view. No simulated network. CI runs only `data-client` scenarios to track our own regressions; competitor libraries are benchmarked locally for comparison.
- **With network (local comparison)** — Same shared-author update but with simulated network delay (consistent ms per "request"). Used to compare overfetching: data-client needs one store update (1 × delay); non-normalized libs typically invalidate/refetch multiple queries (N × delay). **Not run in CI** — run locally with `yarn bench` (no `CI` env) to include these.
- **Memory (local only)** — Heap delta after repeated mount/unmount cycles.
- **Startup (local only)** — FCP and task duration via CDP `Performance.getMetrics`.

## Scenarios

**Hot path (CI)**

- **Init** (`init-100`, `init-500`) — Time to show a ListView component that auto-fetches 100 or 500 items from the list endpoint, then renders (unit: ms). Exercises the full fetch + normalization + render pipeline.
- **Update single entity** (`update-single-entity`) — Time to update one item and propagate to the UI (unit: ms).
- **Update shared author** (`update-shared-author-duration`) — 100 components, shared authors; update one author. Measures time to propagate (unit: ms). Normalized cache: one store update, all views of that author update.
- **Update shared author (scaling)** (`update-shared-author-500-mounted`, `update-shared-author-1000-mounted`) — Same update with 500/1000 mounted components to test subscriber scaling.
- **Ref-stability** (`ref-stability-item-changed`, `ref-stability-author-changed`) — Count of components that received a **new** object reference after an update (unit: count; smaller is better). Normalization keeps referential equality for unchanged entities.
- **Sorted view mount** (`sorted-view-mount-500`) — Mount 500 items through a sorted/derived view. data-client uses `useQuery(sortedItemsQuery)` with `Query` schema memoization; competitors use `useMemo` + sort.
- **Sorted view update** (`sorted-view-update-entity`) — After mounting a sorted view, update one entity. data-client's `Query` memoization avoids re-sorting when sort keys are unchanged.
- **Optimistic update** (`optimistic-update`) — data-client only; applies an optimistic mutation via `getOptimisticResponse`.
- **Invalidate and resolve** (`invalidate-and-resolve`) — data-client only; invalidates a cached endpoint and immediately re-resolves. Measures Suspense boundary round-trip.

**With network (local comparison)**

- **Update shared author with network** (`update-shared-author-with-network`) — Same as above with a simulated delay (e.g. 50 ms) per "request." data-client propagates via normalization (no extra request); other libs invalidate/refetch the list endpoint.

**Memory (local only)**

- **Memory mount/unmount cycle** (`memory-mount-unmount-cycle`) — Mount 500 items, unmount, repeat 10 times; report JS heap delta (bytes) via CDP. Surfaces leaks or unbounded growth.

**Startup (local only)**

- **Startup FCP** (`startup-fcp`) — First Contentful Paint time via CDP `Performance.getMetrics`.
- **Startup task duration** (`startup-task-duration`) — Total main-thread task duration via CDP (proxy for TBT).

## Expected results

These are approximate values to help calibrate expectations. Exact numbers vary by machine and CPU throttling.

| Scenario | data-client | tanstack-query | swr | baseline |
|---|---|---|---|---|
| `init-100` | ~similar | ~similar | ~similar | ~similar |
| `update-shared-author-duration` (100 mounted) | Low (one store write propagates) | Higher (list refetch) | Higher (list refetch) | Higher (list refetch) |
| `ref-stability-item-changed` (100 mounted) | ~1 changed | ~100 changed (list refetch) | ~100 changed (list refetch) | ~100 changed (list refetch) |
| `ref-stability-author-changed` (100 mounted) | ~5 changed | ~100 changed (list refetch) | ~100 changed (list refetch) | ~100 changed (list refetch) |
| `sorted-view-update-entity` | Fast (Query memoization skips re-sort) | Re-sorts on every item change | Re-sorts on every item change | Re-sorts on every item change |

## Expected variance

| Category | Scenarios | Typical run-to-run spread |
|---|---|---|
| **Stable** | `init-*`, `update-single-entity`, `ref-stability-*`, `sorted-view-mount-*` | 2-5% |
| **Moderate** | `update-shared-author-*`, `sorted-view-update-*` | 5-10% |
| **Volatile** | `memory-mount-unmount-cycle`, `startup-*`, `(react commit)` suffixes | 10-25% |

Regressions >5% on stable scenarios or >15% on volatile scenarios are worth investigating.

## Interpreting results

- **Lower is better** for duration (ms), ref-stability counts, and heap delta (bytes).
- **Ref-stability:** data-client's normalized cache keeps referential equality for unchanged entities, so `itemRefChanged` and `authorRefChanged` should stay low. Non-normalized libs typically show higher counts because they create new object references for every cache write.
- **React commit:** Reported as `(react commit)` suffix entries. These measure React Profiler `actualDuration` and isolate React reconciliation cost from layout/paint.
- **Report viewer:** Toggle the "Base metrics", "React commit", and "Trace" checkboxes to filter the comparison table. Use "Load history" to compare multiple runs over time.

## Adding a new library

1. Add a new app under `src/<lib>/index.tsx` (e.g. `src/urql/index.tsx`).
2. Implement the `BenchAPI` interface on `window.__BENCH__`: `init`, `updateEntity`, `updateAuthor`, `unmountAll`, `getRenderedCount`, `captureRefSnapshot`, `getRefStabilityReport`, and optionally `mountUnmountCycle`, `mountSortedView`. Use the shared presentational `ItemsRow` from `@shared/components` and fixtures from `@shared/data`. The harness (`useBenchState`) provides default `init`, `unmountAll`, `mountUnmountCycle`, `getRenderedCount`, and ref-stability methods; libraries only need to supply `updateEntity`, `updateAuthor`, and any overrides.
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

3. **With React Compiler**

   To measure the impact of React Compiler, build and bench with it enabled:

   ```bash
   cd examples/benchmark-react
   yarn build:compiler        # builds with babel-plugin-react-compiler
   yarn preview &
   sleep 5
   yarn bench:compiler        # labels results with [compiler] suffix
   ```

   Or as a single command: `yarn bench:run:compiler`.

   Results are labelled `[compiler]` so you can compare side-by-side with a normal run by loading both JSON files into the report viewer's history feature.

   You can also set the env vars directly for custom combinations:
   - `REACT_COMPILER=true` — enables the Babel plugin at build time
   - `BENCH_LABEL=<tag>` — appends `[<tag>]` to all result names at bench time
   - `BENCH_PORT=<port>` — port for `preview` server and bench runner (default `5173`)
   - `BENCH_BASE_URL=<url>` — full base URL override (takes precedence over `BENCH_PORT`)

4. **Filtering scenarios**

   The runner supports CLI flags (with env var fallbacks) to select a subset of scenarios:

   | CLI flag | Env var | Description |
   |---|---|---|
   | `--lib <names>` | `BENCH_LIB` | Comma-separated library names (e.g. `data-client,swr`) |
   | `--size <small\|large>` | `BENCH_SIZE` | Run only `small` (cheap, full rigor) or `large` (expensive, reduced runs) scenarios |
   | `--action <group\|action>` | `BENCH_ACTION` | Filter by action group (`mount`, `update`, `mutation`, `memory`) or exact action name |
   | `--scenario <pattern>` | `BENCH_SCENARIO` | Substring filter on scenario name |

   CLI flags take precedence over env vars. Examples:

   ```bash
   yarn bench --lib data-client                # only data-client
   yarn bench --size small                      # only cheap scenarios (full warmup/measurement)
   yarn bench --action mount                    # init, mountSortedView
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

   - **Small** (3 warmup + 15 measurement): `init-100`, `update-single-entity`, `update-shared-author-duration`, `ref-stability-*`, `optimistic-update`, `invalidate-and-resolve`, `create-item`, `delete-item`
   - **Large** (1 warmup + 4 measurement): `init-500`, `update-shared-author-500-mounted`, `update-shared-author-2000-mounted`, `memory-mount-unmount-cycle`, `update-shared-author-with-network`, `sorted-view-mount-500`, `sorted-view-update-entity`

   When running all scenarios (`yarn bench`), each group runs with its own warmup/measurement count. Use `--size` to run only one group.

## Output

The runner prints a JSON array in `customSmallerIsBetter` format (name, unit, value, range) to stdout. In CI this is written to `react-bench-output.json` and sent to the benchmark action.

To view results locally, open `bench/report-viewer.html` in a browser and paste the JSON (or upload `react-bench-output.json`) to see a comparison table and bar chart.

## Optional: Chrome trace

Set `BENCH_TRACE=true` when running the bench to enable Chrome tracing for duration scenarios. Trace files are written to disk; parsing and reporting trace duration is best-effort and may require additional tooling for the trace zip format.
