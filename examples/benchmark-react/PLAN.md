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

### Session 5: `useQuery` + `Query` scenario (derived/computed data)

- **`sortedItemsQuery`** — `Query` schema in `resources.ts` using `new Query(new All(ItemEntity), ...)` for globally memoized sorted views
- **`SortedListView`** component added to all 4 library implementations: data-client uses `useQuery(sortedItemsQuery)` (no `useMemo`), competitors use `useMemo(() => [...items].sort(...), [items])`
- **`mountSortedView`** — New `BenchAPI` method seeds cache and renders sorted view
- **`sorted-view-mount-500`** — Scenario measuring mount cost of sorted derived view
- **`sorted-view-update-entity`** — Uses `preMountAction: 'mountSortedView'` to pre-mount sorted view, then updates one entity; data-client `Query` memoization avoids re-sort when sort keys unchanged
- Runner updated with `preMountAction` support and `mountSortedView` in `isMountLike` check

### Session 6: Memory and scaling scenarios

- **`update-shared-author-1000-mounted`** — 1000 components subscribed to overlapping entities; measures per-update scaling cost
- **Fixture data expanded** to 1000 items (from 500) with 20 shared authors for stronger normalization signal
- **`invalidateAndResolve`** — New `BenchAPI` method (data-client only): `controller.invalidate(getItem, { id })` followed by immediate `controller.setResponse` re-resolve; measures Suspense boundary round-trip
- **`invalidate-and-resolve`** scenario added with `onlyLibs: ['data-client']`

### Session 7: Advanced measurement and reporting

- **Report viewer enhanced** (`bench/report-viewer.html`):
  - Metric filtering: checkboxes for "Base metrics", "React commit", and "Trace" suffix entries
  - Time-series charts: upload multiple JSON files from consecutive runs to render a Chart.js line chart showing trends over time
  - Chart instances properly destroyed on re-render
- **Startup metrics** via CDP `Performance.getMetrics`:
  - `startup-fcp` (FirstContentfulPaint) and `startup-task-duration` (TaskDuration, proxy for TBT) reported per library
  - Startup category excluded from CI; runs locally only (5 rounds per library)
  - `getStartupScenarios()` function in scenarios.ts

### Session 8: Polish and documentation

- **README expanded** with: all new scenarios documented, expected results table, expected variance table, metric categories explained, report viewer toggle/history instructions, updated "Adding a new library" section
- **Cursor rule updated** (`.cursor/rules/benchmarking.mdc`): React benchmark scenario list with what they exercise and when to use them, expected variance table, "when to use Node vs React benchmark" guidance
- **CI workflow refined** (`.github/workflows/benchmark-react.yml`): added `packages/endpoint/src/schemas/**` and `packages/normalizr/src/**` to path triggers, added `concurrency` group to prevent parallel benchmark runs on the same branch
