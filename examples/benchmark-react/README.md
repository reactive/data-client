# React Rendering Benchmark

Browser-based benchmark comparing `@data-client/react` (and future: TanStack Query, SWR, baseline) on mount/update scenarios. Built with Webpack via `@anansi/webpack-config`. Results are reported to CI via `rhysd/github-action-benchmark`.

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
