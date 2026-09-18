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
| **POJO tables** | ① default (main entries) | ③ legacy accident via inline `isImmutable` checks — **dropped in F1** (no known users; loud dev-mode error + migration note) |
| **Immutable tables** | ② Track A contract *and* Track B's default recommendation; already implemented by `/imm` | ④ Track B candidate (`EntityRecord`) — **gated by spike B0.0** |

Denormalize always converts entity values to plain classes (`createIfValid`/`fromJS`), so Track A only needs cell ②. Cell ④ is **additive** on top of ② (a new mixin + value policy in `/imm` entries) — Track B can ship ② first and add ④ later without breaking anything, which is why ④ is spike-gated rather than assumed.

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
- **F0.3 — Kill path for cell ③ (decision recorded: drop it).** Main entries today accidentally support POJO tables + immutable *input* (endpoint Object/Union inline checks). Nobody wants this combination; F1 drops it rather than building a hybrid policy. Remaining spike work is only the exit ramp: a loud dev-mode error when immutable input reaches main-entry denormalize (cheap detection at the error site only, not the hot path), and a changelog migration note (convert values, or move fully to `/imm` cell ②).

### F0.2 design outcome (recorded)

**Decision: value policy resolved at `getUnvisit` construction, surfaced as two required delegate members.**

- `getUnvisit(getEntity, cache, args, valuePolicy = PlainValuePolicy)` — main entries rely on the default; `denormalize.imm` passes `ImmValuePolicy`; `MemoCache` forwards `this.policy.valuePolicy` (optional on `IMemoPolicy`, so external custom policies keep working; `undefined` resolves to the default parameter — one-time, not hot path).
- The delegate object literal gains two **always-present** members (single hidden class per policy; no optional fields):
  - `unvisitObject(schema, input)` — object-node denormalization. Plain policy: the consolidated POJO loop. Imm policy: `isImmutable(input) ? denormalizeImmutable(…) : POJO loop`.
  - `getField(value, key)` — normalized-reference field access (polymorphic `schema`/`id` discriminator reads). Plain: `value[key]`. Imm: `isImmutable(value) ? value.get(key) : value[key]`.
- The shorthand object dispatch in `unvisit.ts` routes through the same policy, so normalizr and endpoint share one object-denormalize implementation.
- **Symbol-semantics resolution** (the `ImmutableUtils` drift): consolidate on *propagate the first symbol encountered* (endpoint's semantics). Symbols cross the package boundary, so minting a package-local `INVALID` would break identity checks in the caller; in practice the only symbol in flight is normalizr's `INVALID`, so observable behavior is unchanged for both packages. Test asserts propagation.
- **Cross-version compatibility** (endpoint has no runtime dep on normalizr — interfaces are structural): endpoint schemas capability-check the delegate. `ObjectSchema.denormalize`: `delegate.unvisitObject ? delegate.unvisitObject(this.schema, input) : <legacy inline POJO loop>`. `Polymorphic.denormalizeValue` signature changes `(value, unvisit)` → `(value, delegate)` (endpoint-internal callers all updated; noted in changeset) and reads discriminators via `delegate.getField ? delegate.getField(value, 'schema') : value.schema`. Old endpoint + new normalizr needs nothing (old endpoint keeps its self-contained inline checks). Endpoint's `IDenormalizeDelegate` declares the two members optional (documenting cross-version reality); normalizr's declares them required.
- **Detection decision**: keep duck-typing (own `__ownerID`, present on v4–v5 collections and Records) — no new peer dependency; code now lives only on the `/imm` path. Supported range: immutable v4–v5 (devDep pins 5.x, B3 adds the v4 CI cell). The legacy `_map.__ownerID` fallback (v3 Records) was dropped — v3 is not supported.
- **Dev-mode loud error**: in the plain policy's `unvisitObject` (and endpoint's legacy fallback loop), a `NODE_ENV !== 'production'`-guarded immutable-input check throws with a migration pointer — zero prod hot-path cost, prod-stripped from bundles so the CI no-immutable-code grep passes.
- **Explicit non-goals**: shorthand-array denormalize keeps its generic `input.map` duck-dispatch (works for Immutable List incidentally; not immutable-specific code). `Values` with immutable normalized-map *input* was never supported (no existing branch) and stays unsupported.

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

**Contract question**: cell ② (immutable tables, POJO values) is the working hypothesis for what external users actually want — it already works, and denormalize output is plain classes either way. Cell ④ (Records/Maps as stored values) is only observable in the *store itself* (user middleware, devtools, persistence, hand-written selectors on raw state), so its entire justification must come from store-level capabilities. B0.0 decides whether ④ is worth building at all.

### Stage B0 — Spikes

- **B0.0 — Cell ② vs. cell ④ tradeoff spike (gate for the `EntityRecord` line: B0.1, B0.3, B1).** Since ④ is additive, default to shipping ② and defer ④ unless this spike finds concrete justification. Evaluate:
  - **Performance**: ④ pays Record/Map `get()` field access through the whole normalize lifecycle (`process`/`pk`/`merge`/index extraction) and a double conversion on read (Record in store → plain class out of denormalize). ② runs the ordinary POJO path after table access. Measure normalize + denormalize throughput and memoization stability for both on the imm benchmark suite. Expected: ② wins or ties everywhere; ④ needs a surprise to win.
  - **Bundle size**: ④ adds `EntityRecord` + value-aware Object/Polymorphic denormalize to `/imm` entries (imm users only — measure, but weight lightly).
  - **Simplicity — the real question**: what does ④ enable that ② can't?
    - Store-wide immutability invariants: apps whose middleware/lint rejects plain objects anywhere in state (e.g. strict `redux-immutable-state-invariant`-style enforcement).
    - Deep-persistence rehydration: `fromJS(serialized)` naturally produces ④; supporting only ② means shipping a shallow table-level hydration helper *and* loud dev-mode detection of immutable values in tables (this helper is needed regardless — it's the same hydration footgun Track A's A0.3 identified).
    - User-side structural equality (`Immutable.is`) and cursor patterns over raw store values.
  - Against ④: the full lifecycle override surface from B0.1's findings, a second documented contract, and the double-conversion mental model (Records in store, classes in components).
  - **Decision rule**: ship ② as the documented Track B contract; build ④ only if the spike identifies a named user capability (not aesthetics) that ② + the hydration helper cannot satisfy, and the perf cost is acceptable. Record the outcome as an ADR either way.
- **B0.1 — `EntityRecord` design** *(only if B0.0 selects ④)*. Prototype an Entity mixin for Immutable Record instances. If Records are stored in entity tables, the override surface is the **full lifecycle**, not just denormalize statics: `process` (spreads input), `pk` (property-based prototype method), `normalize` (`Object.hasOwn`, bracket reads, mutation), index extraction, `merge`/`mergeWithStore` (spreads), `fromJS` (`Object.assign`), `createIfValid`, `denormalize` (bracket mutation), plus polymorphic discrimination and `queryKey`. Decide: storage shape (Records in the table vs. POJO storage + Record construction at denormalize — storage shape is public API; POJO storage is the conservative default and dramatically shrinks the override surface); memoization (`toBe` stability with Records across repeated calls and unrelated writes); dependency wiring (optional peer imported only from `/imm`, or duck-typed per F1's detection decision); `/imm` subpath types across the supported TS matrix incl. legacy `typesVersions`.
- **B0.2 — Integration reality check.** Minimal Redux + Immutable example driving the `/imm` APIs. Known mismatch (not just a demand question): `normalize.imm` destructures a plain wrapper object and `MemoCache.query` reads `state.entities`/`state.indexes` as properties — a typical Immutable *root* state needs a thin adapter. Also gauge demand signal from issues/discussions to bound scope.
- **B0.3 — Immutable-input surface matrix** *(only if B0.0 selects ④)*. Broadened per review: every exported schema (Object, Array, Union, Values, All, Collection Array *and* Values, Query, Lazy, Scalar, Invalidate, Serializable) × operation (normalize, denormalize, queryKey) × input kind (Record by id, Record passed by reference, deep-immutable Map, POJO refs inside immutable tables). Include Record discriminator access, Record indexes, and merge ordering. Deliverable → Stage B1 test matrix.

### Stage B1 — `EntityRecord` + `@data-client/endpoint/imm` *(conditional on B0.0 selecting ④)*

Depends on B0.0 (gate), F1 (value-policy seam for nested denormalization), and B0.1/B0.3. If B0.0 selects ②, this stage is replaced by a much smaller one: the shallow table-level hydration helper, dev-mode detection of immutable values in tables (fail loudly instead of the current silent `id: ""` corruption), and converting the corrupt-Record snapshot into an assertion of the *rejection* behavior.

1. Implement per B0.1; new `/imm` subpath in `packages/endpoint` (full packaging checklist: `exports`, `typesVersions`, CJS/native, `npm pack` verification, `yarn build:types`).
2. Fix or explicitly reject the mixed case (plain `Entity` with deep-immutable stored values); if rejected, fail loudly in dev instead of silently producing `id: ""` garbage.
3. Tests: convert the corrupt-Record snapshot into real assertions; re-enable the commented-out expectations in `immutable.test.ts`; cover the B0.3 matrix; referential-stability `toBe` tests; separate test helpers for shallow-table vs. deep-immutable state (existing tests conflate them); all three Jest projects.
4. Changeset (minor) + API reference docs in the same PR.

### Stage B2 — Remove the fake-immutable fallback

Delete `emptyImmutableLike`/`createNestedImmutable`/`deepClone` from `normalize.imm.ts`; require explicit immutable state. Changeset (**breaking** for `/imm` `normalize` callers relying on the implicit default — which existing tests exercise, so those migrate too). Independent of F1 — can land any time.

### Stage B3 — Verification + docs

Depends on F1, B1 (or its cell-② replacement), B2, B0.2.

1. imm-policy benchmark suite in `examples/benchmark` (normalize + memoized denormalize on immutable tables; Record entities only if ④ shipped).
2. CI matrix for the `immutable` version range decided in F1 (v4 + v5 cells if the range spans both).
3. Docs: extend the existing normalizr README ImmutableJS section + site guide — `/imm` entries, the cell-② contract (immutable tables, POJO values) as *the* documented contract, the POJO-leaf constraint and hydration helper, Redux root-state adapter (from B0.2); `EntityRecord` only if ④ shipped. Mark the ROADMAP item done.

---

## Sequencing

```
Immediate: fix /imm denormalize LocalCache(args) bug

F0.1, F0.2, F0.3 ──► F1 (value-policy seam; needed by B1, not by A-track)

Track A:  A0.3 ──► A1 (react/vue accessors) ──► A2 (core seam) ──► A3 (ship opt-in winner)
          A0.1 (gate; needs throwaway A2-prototype adapter) ─┬─► A2/A3 decision
          A0.2 ──────────────────────────────────────────────┘

Track B:  B0.0 (② vs ④ gate) ─┬─ ④ ─► B0.1, B0.3 ──► B1 (EntityRecord + endpoint/imm; needs F1)
                               └─ ② ─► B1-lite (hydration helper + loud rejection)
          B0.2 ────────────────────► B3 (docs, CI matrix; needs F1 + B1 + B2)
          B2 (independent; any time)
```

- A1 and B2 are independent and can land early; neither needs F1.
- A0.1 is the Track A gate: no shippable core immutable work until the benchmark verdict; A1/A2 seams are shape-agnostic and independently justified.
- A0.1 requires prototyping a disposable store-operation adapter (the harness is hard-wired to the default reducer) — this is expected cost, not scope creep.
- B0.0 is the Track B gate for the `EntityRecord` line: cell ④ is additive on top of ②, so deferring it burns no bridges; default outcome is shipping ② with the hydration helper.
- Track B has no performance gate — correctness/completeness commitment; scope bounded by B0.2's demand findings and B0.0's contract decision.
- Breaking changes (F1, B2) should be batched into one planned breaking release with a single migration guide (note: release-type labels must follow the project's 0.x versioning policy).
