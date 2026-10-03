# React Rendering Benchmark

Browser benchmark comparing `@data-client/react`, TanStack Query, SWR, and plain React. Webpack build, Playwright runner. See `README.md` for methodology and running instructions.

## Build & Run

```bash
yarn build:benchmark-react                           # from repo root
yarn workspace example-benchmark-react preview &     # serve dist/ on port 5173
cd examples/benchmark-react && yarn bench            # all libs (local) or data-client only (CI)
```

Filtering: `yarn bench --lib data-client --size small --action update`

## Architecture

**Runner → `window.__BENCH__` → React**: `bench/runner.ts` opens `localhost:5173/<lib>/` in Playwright, calls `BenchAPI` methods on `window.__BENCH__`, waits for `[data-bench-complete]` attribute, then collects `performance.measure` entries. This is the only runner↔app channel.

**Web Worker server**: All "network" goes to an in-memory Worker (`server.worker.ts` via `server.ts` RPC) with configurable latency. Keeps fake-server work off main thread.

**Shared vs library-specific**: `src/shared/` (harness, components, fixtures, resources, server) is identical across all apps. Each `src/<lib>/index.tsx` only contains data-layer wiring. Divergence from shared code breaks fairness.

**Webpack multi-entry**: `webpack.config.cjs` produces four apps at `dist/<lib>/index.html`. `@shared` path alias configured in Webpack + `tsconfig.json`.

## Key Design Decisions

- **MutationObserver timing**: `measureMount`/`measureUpdate` in `benchHarness.tsx` use `MutationObserver` on `[data-bench-harness]`, not React lifecycle. Mount waits for `[data-bench-item]`/`[data-sorted-list]`. Update triggers on first mutation batch, or waits for `isReady` predicate on multi-phase updates.
- **Proxy API**: `window.__BENCH__` is a `Proxy` → `apiRef.current`. `registerAPI` merges library actions with shared defaults. Methods always reflect current React state; adding new `BenchAPI` methods needs no registration boilerplate.
- **renderLimit**: Update scenarios store 1000 items but render only 100 — isolates cache-propagation cost from DOM reconciliation.
- **Expensive UserView**: `components.tsx` `UserView` does deliberate hash/string/date work. Libraries preserving referential equality skip it on unrelated updates; others pay per row.
- **BenchGCPolicy**: data-client's custom `GCPolicy` — zero expiry, no interval timer. Prevents GC during timing; `sweep()` called explicitly for memory scenarios.

## Scenario System

`BASE_SCENARIOS` in `bench/scenarios.ts` × `LIBRARIES` via `flatMap`. `onlyLibs` restricts to specific libs. CI runs data-client hot-path only (no memory/startup/deterministic/gc). Memory and GC are opt-in locally (`--action memory` / `--action gc` / `yarn bench:gc`). Convergent timing uses single page load with adaptive iterations and early stopping on statistical convergence. Ref-stability scenarios run once (deterministic count, not ops/s). GC uses a dedicated fixed-sample phase with an isolated Controller harness (`src/data-client/gcBrowserHarness.ts`), not the DataProvider `benchGC` singleton.

## Update Data Flow

1. Runner calls `window.__BENCH__.updateEntity(1)`
2. `measureUpdate` marks `update-start`, invokes action, `MutationObserver` detects DOM change, marks `update-end` + sets `data-bench-complete`
3. Runner reads `performance.measure('update-duration')`
4. **Core asymmetry**: data-client propagates via one store write; TanStack Query/SWR/baseline invalidate + re-fetch from Worker

## Adding / Modifying

**New scenario**: Add to `BASE_SCENARIOS` → add action to `BenchAPI` in `types.ts` if new → implement in each `src/<lib>/index.tsx` (or use `onlyLibs`) → set `preMountAction`/`mountCount` if setup needed.

**New library**: `src/<lib>/index.tsx` using `registerAPI` → add to `LIBRARIES` in `scenarios.ts` → webpack entry + `HtmlWebpackPlugin` → `package.json` dep.

**Shared components**: Changes to `components.tsx` or `resources.ts` shift all four libraries equally (by design).

## Data Attributes

| Attribute | Flow | Purpose |
|---|---|---|
| `data-app-ready` | harness → runner | `__BENCH__` available |
| `data-bench-harness` | lib → runner | Container for MutationObserver |
| `data-bench-complete` | harness → runner | Iteration finished |
| `data-bench-timeout` | harness → runner | 30s timeout (error) |
| `data-bench-item` | components → harness | Mount detection |
| `data-sorted-list` | lib views → harness | Sorted-view mount detection |
| `data-detail-view` | lib views → harness | Multi-view detection |
| `data-issue-number` | components → runner/harness | Item identity assertion |
| `data-title` | components → lib views | Text content assertion |
| `data-state-list` | lib views → harness | Move-item verification |

## Environment Variables

| Variable | Effect |
|---|---|
| `CI` | data-client hot-path only; tighter convergence |
| `REACT_COMPILER=false` | Disables React Compiler at build |
| `BENCH_LABEL=<tag>` | Appends `[<tag>]` to result names |
| `BENCH_PORT` | Preview port (default 5173) |
| `BENCH_TRACE=true` | Chrome tracing for duration scenarios |
| `BENCH_V8_TRACE=true` | Launch Chromium with `--trace-opt --trace-deopt`; output to `v8-trace.log` |
| `BENCH_V8_DEOPT=true` | Launch Chromium with `--prof`; V8 logs to `v8-logs/` |
| `BENCH_GC_SAMPLES` | Samples per GC scenario (default 5; also `--samples`) |
| `BENCH_GC_OUTPUT` | Override path for detailed GC JSON (default `gc-measurement-output.json`, gitignored) |

BuildManifest v1 is written to `dist/gc-build-manifest.json` after webpack (`yarn build`). `buildId` digests schemaVersion, commit, dirty, sourceDigest, and sorted artifact hashes. GC runs require a matching served manifest.
