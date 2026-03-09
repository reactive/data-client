# React Rendering Benchmark – Progress & Future Work

---

## Completed

### Session 1: Core harness + data-client implementation

- Playwright-based runner with Chrome tracing, CDP heap measurement, CPU throttling
- `performance.measure()` + React Profiler `onRender` for dual JS/React metrics
- Interleaved library execution with shuffled ordering for statistical fairness
- `customSmallerIsBetter` JSON output for `rhysd/github-action-benchmark` CI integration
- Report viewer (`bench/report-viewer.html`) with Chart.js comparison table

### Session 2: Competitor implementations

- `tanstack-query/`, `swr/`, `baseline/` apps with identical `BenchAPI` interface
- Shared presentational `ItemRow` component and fixture data across all libraries
- Multi-entry webpack config serving each library at its own path

### Session 3: Entity update propagation (normalization showcase)

- **`update-shared-author-duration`** — Mount 100 items (sharing 20 authors), update one author; measure duration (ms)
- **Ref-stability scenarios** — `ref-stability-item-changed` and `ref-stability-author-changed` report component reference change counts (smaller is better)
- Shared `refStability` module and `BenchAPI.captureRefSnapshot` / `getRefStabilityReport` / `updateAuthor`

### Session 4: Best practices fixes + new scenarios

**Best practices fixes:**
- `ItemEntity.author` default changed from `AuthorEntity` (class) to `AuthorEntity.fromJS()` (idiomatic Entity default)
- Removed `as unknown as Item` cast in data-client `ItemView` (entity `fromJS()` fix resolved the type mismatch)
- `optimisticRollback` replaced with real `optimisticUpdate` using `getOptimisticResponse` on an endpoint with `sideEffect: true`; `controller.fetch()` applies the optimistic response immediately

**New scenarios:**
- **`bulk-ingest-500`** — Generate fresh data at runtime, ingest into cache, and render 500 items. For data-client this exercises the full normalization pipeline; competitors seed per-item cache entries. Uses `generateFreshData()` with distinct `fresh-*` IDs to avoid pre-seeded cache hits
- **`withNetwork` per-library request counts** — Non-normalized libraries now simulate 5 network round-trips (one per affected item query sharing the updated author), while data-client simulates 1 (normalization propagates automatically)

**Refactors:**
- All implementations switched from `count: number` state to `ids: string[]` state for cleaner bulk-ingest support
- Scenario generation supports `perLibArgs` overrides and `onlyLibs` filtering

---

## Future Work

### Session 5: `useQuery` + `Query` scenario (derived/computed data)

Add a scenario that demonstrates `Query` schema memoization:
- Mount a component showing items sorted/filtered via `useQuery(sortedQuery)` (data-client) vs inline `useMemo` sort (competitors)
- Update one entity and measure rerender cost of the derived view
- Requires adding a `SortedView` component to each library implementation

### Session 6: Memory and scaling scenarios

- **Many-subscriber scaling:** Mount 500+ components subscribed to overlapping entities; measure per-update cost
- **Cache invalidation cycle:** `controller.invalidate()` → Suspense fallback → re-resolve; measure full cycle time

### Session 7: Advanced measurement and reporting

- **React Profiler as primary metric:** Use `<Profiler onRender>` duration as a separate reported metric alongside `performance.measure()`
- **Local HTML report:** Enhance report viewer with time-series charts for CI history
- **Lighthouse-style metrics:** FCP, TBT for initial load comparison

### Session 8: Polish and documentation

- **README:** Expand with methodology (what we measure, why), how to add a new library, and how to run locally vs CI
- **Cursor rule:** Update `.cursor/rules/benchmarking.mdc` to document the React benchmark
- **CI workflow:** Add GitHub Actions workflow for React benchmark (separate from existing Benchmark.js workflow)
