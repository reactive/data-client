# React Rendering Benchmark

Browser-based benchmark comparing `@data-client/react`, TanStack Query, SWR, and a plain React baseline on mount/update scenarios. Built with Webpack via `@anansi/webpack-config`. Results are reported to CI via `rhysd/github-action-benchmark`.

## Comparison to Node benchmarks

The repo has two benchmark suites:

- **`examples/benchmark`** (Node) — Measures the JS engine only: `normalize`/`denormalize`, `Controller.setResponse`/`getResponse`, reducer throughput. No browser, no React. Use it to validate core and normalizr changes.
- **`examples/benchmark-react`** (this app) — Measures the full React rendering pipeline: same operations driven in a real browser, with layout and paint. Use it to validate `@data-client/react` and compare against other data libraries.

## Methodology

- **What we measure:** Wall-clock time from triggering an action (e.g. `mount(100)` or `updateAuthor('author-0')`) until the harness sets `data-bench-complete` (after two `requestAnimationFrame` callbacks). Optionally we also record React Profiler commit duration and, with `BENCH_TRACE=true`, Chrome trace duration.
- **Why:** Normalized caching should show wins on shared-entity updates (one store write, many components update) and ref stability (fewer new object references). See [js-framework-benchmark “How the duration is measured”](https://github.com/krausest/js-framework-benchmark/wiki/How-the-duration-is-measured) for a similar timeline-based approach.
- **Statistical:** Warmup runs are discarded; we report median and 95% CI. Libraries are interleaved per round to reduce environmental variance.

## Scenario categories

- **Hot path (in CI)** — JS-only: mount, update propagation, ref-stability. No simulated network. These run in CI and track regression.
- **With network (comparison only)** — Same shared-author update but with simulated network delay (consistent ms per "request"). Used to compare overfetching: data-client needs one store update (1 × delay); non-normalized libs typically invalidate/refetch multiple queries (N × delay). **Not run in CI** — run locally with `yarn bench` (no `CI` env) to include these.

## Scenarios

**Hot path (CI)**

- **Mount** — Time to mount 100 or 500 item rows (unit: ms).
- **Update single entity** — Time to update one item and propagate to the UI (unit: ms).
- **Update shared author** (`update-shared-author-duration`) — 100 components, shared authors; update one author. Measures time to propagate (unit: ms). Normalized cache: one store update, all views of that author update.
- **Ref-stability item/author** (`ref-stability-item-changed`, `ref-stability-author-changed`) — Count of components that received a **new** object reference after an update (unit: count; smaller is better). Normalization keeps referential equality for unchanged entities.

**With network (local comparison)**

- **Update shared author with network** (`update-shared-author-with-network`) — Same as above with a simulated delay (e.g. 50 ms) per "request." data-client uses 1 request; other libs can be compared with higher `simulatedRequestCount` to model overfetching.

**Memory (local only)**

- **Memory mount/unmount cycle** (`memory-mount-unmount-cycle`) — Mount 500 items, unmount, repeat 10 times; report JS heap delta (bytes) via CDP. Surfaces leaks or unbounded growth.

**Other**

- **Optimistic update rollback** — data-client only; measures time to apply and then roll back an optimistic update.

## Interpreting results

- **Lower is better** for duration (ms), ref-stability counts, and heap delta (bytes).
- **Expected variance:** Duration and ref-stability are usually within a few percent run-to-run; heap and “react commit” can vary more. Regressions &gt; 5–10% on stable scenarios are worth investigating.
- **Ref-stability:** data-client’s normalized cache keeps referential equality for unchanged entities, so `itemRefChanged` and `authorRefChanged` should stay low (e.g. 1 and ~25 for “update one author” with 100 rows). Non-normalized libs typically show higher counts.

## Adding a new library

1. Add a new app under `src/<lib>/index.tsx` (e.g. `src/urql/index.tsx`).
2. Implement the same `BenchAPI` interface on `window.__BENCH__`: `mount`, `updateEntity`, `updateAuthor`, `unmountAll`, `getRenderedCount`, `captureRefSnapshot`, `getRefStabilityReport`, and optionally `mountUnmountCycle`, `optimisticRollback`. Use the shared presentational `ItemRow` from `@shared/components` and fixtures from `@shared/data`.
3. Add the library to `LIBRARIES` in `bench/scenarios.ts`.
4. Add a webpack entry in `webpack.config.cjs` for the new app and an `HtmlWebpackPlugin` entry so the app is served at `/<lib>/`.
5. Add the dependency to `package.json` and run `yarn install`.

## Running locally

1. **Install system dependencies (Linux / WSL)**  
   Playwright needs system libraries to run Chromium. If you see “Host system is missing dependencies to run browsers”:

   ```bash
   sudo npx playwright install-deps chromium
   ```

   Or install manually (e.g. Debian/Ubuntu):

   ```bash
   sudo apt-get install libnss3 libnspr4 libasound2t64
   ```

2. **Build and run**

   ```bash
   yarn build:benchmark-react
   yarn workspace example-benchmark-react preview &
   sleep 5
   cd examples/benchmark-react && yarn bench
   ```

   Or from repo root after a build: start preview in one terminal, then in another run `yarn workspace example-benchmark-react bench`.

## Output

The runner prints a JSON array in `customSmallerIsBetter` format (name, unit, value, range) to stdout. In CI this is written to `react-bench-output.json` and sent to the benchmark action.

To view results locally, open `bench/report-viewer.html` in a browser and paste the JSON (or upload `react-bench-output.json`) to see a comparison table and bar chart.

## Optional: Chrome trace

Set `BENCH_TRACE=true` when running the bench to enable Chrome tracing for duration scenarios. Trace files are written to disk; parsing and reporting trace duration is best-effort and may require additional tooling for the trace zip format.
