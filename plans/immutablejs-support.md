# ImmutableJS — Two-Track Plan

Status: draft (revised after adversarial review)
Owner: TBD
Related: [GOALS.md](../GOALS.md), `docs/ROADMAP.md` ("Immutable.js support as optional peerdep")

## Two distinct goals

**Track A — Internal store performance (core + react).** Use immutable data structures *inside* the store as a potential performance optimization, targeting the degenerate-case store-size-scaling writes measured by the `spread` benchmark suite (`examples/benchmark/spread.js` — single-entity `setResponse` into 1k/10k/100k stores plus flat control, 10k cached endpoint keys, collection push, `invalidateAll`/`expireAll`), the `core` `^set` benchmarks, and the memory-pressure script (`yarn workspace example-benchmark start:memory` — allocation/op, GC churn, retained heap). The spread scenarios' memory symptom is transient allocation + GC churn from store-size-proportional copies, which is what persistent structural sharing attacks. ImmutableJS must **never leak** to user data: entities stay plain classes, hook outputs unchanged, referential-stability contracts hold. This track is benchmark-gated — if immutable tables don't clearly win, we ship the cheaper alternative (or status quo) and close the ImmutableJS half with an ADR.

**Important scope caveat**: the store state shape is *not* a pure implementation detail. `State<unknown>` is a public exported type (`packages/core/src/types.ts`), observed via `controller.getState()`, `Manager.init`/middleware, the `initialState` prop, SSR payloads, and devtools — and normalizr's AGENTS.md states "storage shape is API". Consequence: an **opt-in** store policy is a minor feature; changing the **default** state representation (even to native `Map`) is a breaking change. Track A plans for opt-in.

**Track B — External ImmutableJS support for `@data-client/normalizr` users.** Users with their own ImmutableJS-based stores (e.g. Redux + Immutable) who drive `normalize`/`denormalize`/`MemoCache` directly. Here ImmutableJS *is* the user-facing contract, including entity values as Immutable Records (`EntityRecord`). Correctness- and docs-focused, not performance-focused.

### The two independent axes

Table representation and value representation are separate policy dimensions; conflating them is how scope creeps:

| | POJO values | Immutable values |
|---|---|---|
| **POJO tables** | default (main entries) | legacy main-entry behavior via inline `isImmutable` checks (to be policy-gated in F1) |
| **Immutable tables** | Track A contract; already implemented by `/imm` | Track B contract (`EntityRecord`) |

Denormalize always converts entity values to plain classes (`createIfValid`/`fromJS`), so Track A only needs the immutable-tables/POJO-values cell. `EntityRecord` and immutable-value denormalization are Track B only.

## Constraints (from GOALS.md — apply to both tracks)

1. **Zero bundle cost for non-users** — all immutable code behind `/imm` subpath exports.
2. **Zero runtime cost for the default path** — no per-call duck-type checks; behavior differences resolved once via policy injection (the `MemoCache(policy)` pattern from 0.15). Policy hooks must be monomorphic — no optional delegate fields (hidden-class constraints per `packages/normalizr/AGENTS.md`).
3. **SRP / drift protection** — one implementation per concern; immutable semantics in dedicated modules, never inlined into shared schema code.
4. **Leaf reference identity is sacred** — store policies must never wrap or proxy entity leaves on read; `WeakDependencyMap` chains are keyed by leaf object identity (`packages/normalizr/AGENTS.md`).
5. **Wide version ranges** — endpoint and normalizr declare `IDenormalizeDelegate` independently; any delegate-protocol change needs cross-version compatibility testing (or a capability check) so new endpoint works with older normalizr and vice versa.
6. **Track A only**: no ImmutableJS observable from `@data-client/react` hooks or user data. Acknowledged soft leaks when the opt-in policy is active: `controller.getState()`, `Manager.init`, middleware, devtools — documented caveats.

## Current state (baseline)

- `@data-client/normalizr/imm` exists: `MemoPolicy` (`ImmDelegate`), `normalize`, `denormalize`, `ImmNormalizeDelegate`. `MemoCache` takes a policy; `Controller` takes a preconstructed `memo` (policy injection is indirect, via `new MemoCache(policy)`).
- **Supported contract**: outer tables (`entities`/`indexes`/`entitiesMeta`) immutable, entity values POJO. Tested for `Values`, `All`, `Invalidate`, `Query`, `MemoCache`. Note: some existing tests use deep `fromJS` (immutable values) — test helpers need to distinguish the two contracts deliberately.
- **Known bugs (fix immediately, no stage gate)**:
  - `denormalize.imm.ts` constructs `LocalCache()` **without `args`** while the main entry passes `new LocalCache(args)` — breaks args-dependent schemas (e.g. `Scalar`'s `argsKey` path) on direct `/imm` denormalize.
- **Known gaps**:
  - `isImmutable`/`denormalizeImmutable` ship in **main** bundles: normalizr `schemas/Object.ts`, endpoint `schemas/Object.ts` + `schemas/Polymorphic.ts` (Polymorphic exists only in endpoint); per-object hot-path check for everyone. The two `ImmutableUtils.ts` copies have drifted (different signatures; normalizr collapses nested symbols to `INVALID`, endpoint propagates the symbol).
  - Entity values as Records/Maps are broken (`fromJS`/`merge`/`denormalize` assume POJOs; corrupt snapshot committed in `packages/normalizr/src/__tests__/__snapshots__/immutable.test.ts.snap`). `EntityRecord.ts` is an empty stub. (Track B)
  - Core reducers/`Controller`/`GCPolicy`/managers and react+vue hooks assume POJO state shape (details in A0.3). (Track A)
  - `normalize.imm.ts` ships a fake-immutable default store (`deepClone`, `createNestedImmutable`).
  - `immutable` is a devDependency only; runtime detection is duck-typed against private internals (`__ownerID`, `_map`) — version-range/predicate decision needed.
  - Docs: normalizr README has an ImmutableJS section (`/imm` normalize/denormalize examples) but doesn't cover the POJO-leaf contract, `MemoPolicy`, Records, Redux integration, or hydration.

---

## Shared Foundation — Stage F1: evict immutable code from main bundles

Creates the *value-shape* policy seam. Prerequisite for B1 (and the F-track bundle goals); **not** a prerequisite for Track A spikes or A1 (Track A uses the existing table policy).

### Spikes

- **F0.1 — Measure the `isImmutable` hot-path cost.** Microbenchmark in `examples/benchmark/micro.js` isolating object-schema denormalize with/without the check. Sets the regression gate; tells us whether the payoff is perf (0.15 entity-path removal claimed 10–20%) or only bundle/SRP.
- **F0.2 — Design the value-policy seam end to end.** Known constraints discovered in review:
  - `getUnvisit` currently receives only `getEntity`/cache/args — the policy is reduced to `getEntities()` in `MemoCache.denormalize` before `getUnvisit` is called. The seam must thread a denormalize strategy through construction.
  - A closure-resolved strategy only fixes the *shorthand* Object dispatch in `unvisit.ts`; endpoint `Object.denormalize` receives the delegate, and `Polymorphic` receives only `unvisit` through Array/Values — so the **delegate protocol** changes, which triggers constraint 5 (cross-package version compatibility).
  - Must hold ≤2% on cached `normalizr` benches; no optional delegate fields.
- **F0.3 — Migration path for the legacy cell.** Main entries today support POJO tables + immutable *input* (endpoint Object/Union). `/imm`'s `MemoPolicy` requires `getIn` tables, so "switch to `/imm`" is **not** drop-in for those users. Decide: a hybrid policy (POJO tables + immutable-value handling), an explicit conversion recipe, or dropping the combination with a loud error.

### Work items

1. Move the immutable branches of normalizr `Object.ts`, endpoint `Object.ts`, and endpoint `Polymorphic.ts` behind the value policy; POJO policy performs no check.
2. Consolidate the two drifted `ImmutableUtils.ts` copies (resolving the symbol-propagation difference deliberately, with a test).
3. Decide the ImmutableJS detection approach (official predicates vs. duck-typing) and supported version range here — F1 owns it since consolidation bakes it in (B3 CI matrix verifies it).
4. Cross-version compatibility tests (new endpoint ↔ old normalizr and inverse) or a delegate capability check.
5. Bundle verification (`yarn ci:build:bundlesize`) + a CI grep asserting main entries contain no immutable code.
6. Changeset — **breaking**, precisely scoped: immutable normalized *input* with main-entry (POJO-table) denormalization; migration per F0.3 outcome. (Immutable *tables* already required `/imm` since 0.15.)

**Exit criteria**: no immutable code in main bundles; POJO benches within noise or improved; `/imm` tests green; F0.3 migration documented.

---

## Track A — Internal store performance

### Stage A0 — Spikes (A0.1 is the go/no-go gate for the whole track)

- **A0.1 — Three-arm store benchmark (gate).** The `spread` suite + `start:memory` measure the right scenarios, but the harness is hard-wired to the default `Controller`/`createReducer` (`spread-scenarios.js`) — arms 2–3 require a **throwaway store-operation adapter** (a disposable prototype of the A2 seam; budget for this). Arms:
  1. Current POJO tables (lazy per-key clone; the `control` scenario shows the flat baseline),
  2. Immutable Map tables (existing `ImmNormalizeDelegate` for entity tables; prototype immutable `endpoints`/`meta` reducer ops),
  3. Native `Map` tables with clone-on-write.

  **Honest expectations**: arm 3's `new Map(old)` is O(n) like the spread — it's a *constant-factor control*, not an asymptotic competitor; only arm 2 (HAMT) can flatten the `setOneEntity` sweep. A mutable-Map variant would be O(1) but keeps stable identity, breaking React `useMemo`/`useSyncExternalStore` invalidation — only viable with explicit version tokens (separate design, only if arm 2 fails). Also: collection push stays O(collection) (array copy in `pushMerge`) and `invalidateAll`/`expireAll` stay O(keys) under every arm — expect improved constants at best there. Counter-metrics: `core` `^get` and denormalize-miss overhead (`getIn` vs. property access), allocation/op and GC pause from `start:memory`. Follow the paired trimmed-mean methodology from `packages/normalizr/AGENTS.md`. **Decision rule**: ImmutableJS proceeds only if arm 2 clearly beats arm 3 on the sweep *and* memory metrics without regressing `^get`; otherwise ship arm 3 (as opt-in, given the public-shape caveat) or status quo, and write the closing ADR.
- **A0.2 — GC sweep vs. memoization (corrected).** The GC reducer deletes in place (`createReducer.ts`) — safe because refcounts are zero. Per-entity denormalization chains are keyed by **leaf entity identity**, so an immutable `deleteIn` of one pk does *not* bust surviving entities' chains. What does change: the per-type table identity (`getEntitiesObject` deps), which invalidates **queryKey caches** (`All`, collection membership) for that type per sweep — arguably *correct* invalidation, but measure the re-query cost at GC frequency. `withMutations` batches a sweep but still yields one new table identity per type. Add a GC + `All`-query benchmark case for this.
- **A0.3 — State-read/write audit → accessor + facade design.** Complete inventory (review-verified):
  - **Reducers**: `setResponseReducer` *and* `setReducer` import POJO `normalize` directly; `endpoints`/`meta` spreads including the **error path** (`reduceError`); `endpoint.update()` updaters read/write `endpoints[key]`; `fetchReducer` optimistic-array writes; `RESET` reinstalls POJO `initialState`; GC branch.
  - **Core reads**: `Controller` (`state.endpoints[key]`, `entityExpiresAt` over `state.entitiesMeta`), `selectMeta`, `GCPolicy` (both meta tables), `initManager` (raw state), `NetworkManager` and `PollingSubscription` (`state.meta[key]`).
  - **React**: bracket reads in `useCache`/`useSuspense`/`useFetch`/`useDLE`/`useQuery`; `useCache`/`useDLE` also construct `{...state, entities: {}}` fallback states — accessors alone don't fix this; the policy must provide an empty-tables factory. Table refs as `useMemo` deps are identity-only and already shape-agnostic.
  - **Vue**: same `entities: {}` pattern in `packages/vue` consumers; `createDataClient` builds `initialState` and does optimistic replay.
  - **SSR**: lives at `packages/react/src/server` (published `@data-client/react/ssr`) — `ServerData` JSON-serializes state, `getInitialData` parses it; NextJS + Redux (`ExternalDataProvider`, `prepareStore`) variants. Native `Map` serializes to `{}` via JSON; Immutable needs conversion. Hydration must be **shallow/table-level** — a generic deep `fromJS` would corrupt POJO leaves (arrays, Union discriminators, endpoint Object results). Design schema-preserving table-level (de)serialization, not `toJS`/`fromJS`.
  - **Test utilities**: `core/src/mock/mockState.ts` (`mockInitialState`) and react/vue test wrappers construct POJO state — need policy-aware fixtures.
  - **Devtools**: display serialization for immutable state.

  Deliverable: the accessor/facade API and the list of policy operations (initial state, empty-tables factory, table get/set/delete, serialize/hydrate).

### Stage A1 — React/Controller accessor refactor (independent, zero user-facing change)

Route hook bracket reads through `Controller` accessors and replace the `entities: {}` fallback construction with a policy/Controller-provided mechanism, per A0.3. Apply the same to `packages/vue`. Ships on its own — correctness-neutral decoupling that benefits any future store representation. Does **not** depend on F1.

**Exit criteria**: `packages/react` and `packages/vue` contain no POJO-shape assumptions on state; all Jest projects green; react benchmarks within noise.

### Stage A2 — Core store policy seam

Make state-shape-dependent operations pluggable via one injected store policy (mirroring `MemoCache(policy)`), covering the full A0.3 inventory: both reducers' normalize wiring, all table ops including error paths and `endpoint.update()`, `RESET`/initial state, GC branch (per A0.2), Controller/manager reads, empty-tables factory, and the serialize/hydrate hooks. Depends on A0.3 (design) and benefits from A1 landing first (fewer raw-state consumers).

POJO policy is the default with **zero added indirection cost** (verify on `core` `^set`/`^get` benches, ≤2%; the tracked `benchmark-spread.yml` case guards the write path automatically since it triggers on `packages/core/src/state/**`).

**Exit criteria**: default path benchmark-neutral; policy is the single injection point; policy-aware `mockInitialState`/test fixtures.

### Stage A3 — Ship the winning store (opt-in)

- If **ImmutableJS won A0.1**: `@data-client/core/imm` exporting the immutable store policy; opt-in wiring through `DataProvider`/`CacheProvider` — mind the RSC boundary (policy objects aren't serializable; likely a subpath provider so server and client select the same policy). `immutable` as optional peer of core. Document the `getState()`/`Manager.init`/middleware caveats. SSR round-trip tests (Object results, Union discriminators, Collections, symbols, POJO leaves).
- If **native-Map or status quo won**: ship as opt-in policy (default change would be breaking per the scope caveat) or keep status quo; write the ADR closing the ImmutableJS internal-store question with benchmark evidence.
- Either way: add a policy-specific named benchmark case + CI trigger paths (`benchmark-spread.yml` runs the default policy and won't show opt-in wins on its own); packaging checklist for any new subpath (`exports`, `typesVersions` — wildcard mappings would otherwise resolve subpaths to the main declarations — CJS/native variants, `npm pack` verification).

Changeset (minor — opt-in). Docs per docs-in-same-PR policy.

**Exit criteria**: measured wins on the `spread` sweep and `start:memory` metrics under the opt-in policy's named CI case; `core` `^set`/`^get` and react suites show no default-path regression; zero user-visible data-shape change on the default path.

---

## Track B — External `normalizr` + ImmutableJS support

Target user: owns their store (e.g. Redux + Immutable), calls `normalize`/`denormalize`/`MemoCache(ImmPolicy)` directly. Core's internal store is explicitly **not** this track's concern (that's Track A).

### Stage B0 — Spikes

- **B0.1 — `EntityRecord` design.** Prototype an Entity mixin for Immutable Record instances. If Records are stored in entity tables, the override surface is the **full lifecycle**, not just denormalize statics: `process` (spreads input), `pk` (property-based prototype method), `normalize` (`Object.hasOwn`, bracket reads, mutation), index extraction, `merge`/`mergeWithStore` (spreads), `fromJS` (`Object.assign`), `createIfValid`, `denormalize` (bracket mutation), plus polymorphic discrimination and `queryKey`. Decide: storage shape (Records in the table vs. POJO storage + Record construction at denormalize — storage shape is public API; POJO storage is the conservative default and dramatically shrinks the override surface); memoization (`toBe` stability with Records across repeated calls and unrelated writes); dependency wiring (optional peer imported only from `/imm`, or duck-typed per F1's detection decision); `/imm` subpath types across the supported TS matrix incl. legacy `typesVersions`.
- **B0.2 — Integration reality check.** Minimal Redux + Immutable example driving the `/imm` APIs. Known mismatch (not just a demand question): `normalize.imm` destructures a plain wrapper object and `MemoCache.query` reads `state.entities`/`state.indexes` as properties — a typical Immutable *root* state needs a thin adapter. Also gauge demand signal from issues/discussions to bound scope.
- **B0.3 — Immutable-input surface matrix.** Broadened per review: every exported schema (Object, Array, Union, Values, All, Collection Array *and* Values, Query, Lazy, Scalar, Invalidate, Serializable) × operation (normalize, denormalize, queryKey) × input kind (Record by id, Record passed by reference, deep-immutable Map, POJO refs inside immutable tables). Include Record discriminator access, Record indexes, and merge ordering. Deliverable → Stage B1 test matrix.

### Stage B1 — `EntityRecord` + `@data-client/endpoint/imm`

Depends on F1 (value-policy seam for nested denormalization) and B0.1/B0.3.

1. Implement per B0.1; new `/imm` subpath in `packages/endpoint` (full packaging checklist: `exports`, `typesVersions`, CJS/native, `npm pack` verification, `yarn build:types`).
2. Fix or explicitly reject the mixed case (plain `Entity` with deep-immutable stored values); if rejected, fail loudly in dev instead of silently producing `id: ""` garbage.
3. Tests: convert the corrupt-Record snapshot into real assertions; re-enable the commented-out expectations in `immutable.test.ts`; cover the B0.3 matrix; referential-stability `toBe` tests; separate test helpers for shallow-table vs. deep-immutable state (existing tests conflate them); all three Jest projects.
4. Changeset (minor) + API reference docs in the same PR.

### Stage B2 — Remove the fake-immutable fallback

Delete `emptyImmutableLike`/`createNestedImmutable`/`deepClone` from `normalize.imm.ts`; require explicit immutable state. Changeset (**breaking** for `/imm` `normalize` callers relying on the implicit default — which existing tests exercise, so those migrate too). Independent of F1 — can land any time.

### Stage B3 — Verification + docs

Depends on F1, B1, B2, B0.2.

1. imm-policy benchmark suite in `examples/benchmark` (normalize + memoized denormalize on immutable tables; Record entities after B1).
2. CI matrix for the `immutable` version range decided in F1 (v4 + v5 cells if the range spans both).
3. Docs: extend the existing normalizr README ImmutableJS section + site guide — `/imm` entries, `EntityRecord`, the tables-immutable vs. values-immutable contracts, POJO-leaf constraint, Redux root-state adapter (from B0.2), hydration. Mark the ROADMAP item done.

---

## Sequencing

```
Immediate: fix /imm denormalize LocalCache(args) bug

F0.1, F0.2, F0.3 ──► F1 (value-policy seam; needed by B1, not by A-track)

Track A:  A0.3 ──► A1 (react/vue accessors) ──► A2 (core seam) ──► A3 (ship opt-in winner)
          A0.1 (gate; needs throwaway A2-prototype adapter) ─┬─► A2/A3 decision
          A0.2 ──────────────────────────────────────────────┘

Track B:  B0.1, B0.3 ──► B1 (EntityRecord + endpoint/imm; needs F1)
          B0.2 ─────────► B3 (docs, CI matrix; needs F1 + B1 + B2)
          B2 (independent; any time)
```

- A1 and B2 are independent and can land early; neither needs F1.
- A0.1 is the gate: no shippable core immutable work until the benchmark verdict; A1/A2 seams are shape-agnostic and independently justified.
- A0.1 requires prototyping a disposable store-operation adapter (the harness is hard-wired to the default reducer) — this is expected cost, not scope creep.
- Track B has no performance gate — correctness/completeness commitment; scope bounded by B0.2's demand findings.
- Breaking changes (F1, B2) should be batched into one planned breaking release with a single migration guide (note: release-type labels must follow the project's 0.x versioning policy).
