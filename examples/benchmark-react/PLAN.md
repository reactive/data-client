# React Rendering Benchmark – Future Work

Follow this plan in later sessions to extend the benchmark suite.

---

## Session 2: Competitor implementations

Add apps that implement the same `BenchAPI` (`window.__BENCH__`) and use the same presentational components so results are comparable.

- **`apps/tanstack-query/`** (or `src/tanstack-query/` if keeping single webpack entry)
  - Use `@tanstack/react-query` with `useQuery` and `queryClient.setQueryData` for cache seeding.
  - Same scenarios: mount N items, update single entity.
- **`apps/swr/`**
  - Use `swr` with `mutate` for cache seeding.
- **`apps/baseline/`**
  - Plain `useState` + `useContext`, no caching library (baseline).

**Deliverables:** Each app exposes the same `window.__BENCH__` interface and uses the same `ItemRow` (or shared) presentational component. Extend webpack to multi-entry so each app is built and served at e.g. `/data-client/`, `/tanstack-query/`, etc. Update `bench/runner.ts` and `bench/scenarios.ts` to iterate over all libraries and report per-library results.

---

## Session 3: Entity update propagation (normalization showcase) — Done

Implemented:

- **`update-shared-author-duration`** — Mount 100 items (sharing 20 authors), update one author; measure duration (ms).
- **Ref-stability scenarios** — `ref-stability-item-changed` and `ref-stability-author-changed` report how many components received a new object reference after an update (unit: count; smaller is better). data-client’s normalized cache keeps referential equality for unchanged entities, so these counts stay low (1 and ~25 respectively).
- Shared `refStability` module and `BenchAPI.captureRefSnapshot` / `getRefStabilityReport` / `updateAuthor`; `getAuthor` endpoint and `FIXTURE_AUTHORS` for seeding.

---

## Session 4: Memory and scaling scenarios

Add memory and stress scenarios.

- **Memory under repeated operations:** Cycle mount → unmount N times; measure heap (e.g. `Performance.getMetrics` / JSHeapUsedSize via CDP) to detect growth.
- **Many-subscriber scaling:** Mount 500+ components subscribed to overlapping entities; measure per-update cost (time and/or memory).
- **Optimistic update + rollback:** Optimistic mutation, then simulate error and rollback; measure time to revert DOM.

**Deliverables:** New scenarios in `bench/scenarios.ts`, optional `bench/memory.ts` for CDP heap collection, and report entries for memory metrics (e.g. `customSmallerIsBetter` with unit `bytes` where applicable).

---

## Session 5: Advanced measurement and reporting

- **React Profiler:** Use `<Profiler onRender>` (and/or `performance.measure`) to record React commit duration as a separate metric alongside existing measures.
- **Local HTML report:** Build a small report viewer (e.g. `bench/report-viewer.html` or a small app) that loads saved JSON and displays a table/charts for comparing libraries (similar to krausest results table).
- **Lighthouse-style metrics:** Optionally add FCP, TBT, or other metrics for initial load comparison (e.g. via CDP or Lighthouse CI).

**Deliverables:** Profiler instrumentation in app(s), report viewer, and optionally Lighthouse/load metrics in the runner and report format.

---

## Session 6: Polish and documentation

- **README:** Expand with methodology (what we measure, why), how to add a new library, and how to run locally vs CI.
- **Cursor rule:** Update `.cursor/rules/benchmarking.mdc` (or equivalent) to document the React benchmark: where it lives, how to run it, and how it relates to the existing Node `example-benchmark` suite.
- **AGENTS.md:** If appropriate, add a short mention of the React benchmark and link to this plan or the README.

**Deliverables:** Updated README, rule file, and any AGENTS.md changes.
