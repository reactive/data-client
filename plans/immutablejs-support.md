# ImmutableJS — Two-Track Plan

Status: draft
Owner: TBD
Related: [GOALS.md](../GOALS.md), `docs/ROADMAP.md` ("Immutable.js support as optional peerdep")

## Two distinct goals

**Track A — Internal store performance (core + react).** Use immutable data structures *inside* the store as a potential performance optimization, targeting the spread-heavy `core` benchmarks (`^set` suite) and memory benchmarks (heap-delta scenarios in `examples/benchmark-react`). ImmutableJS is an implementation detail here and must **never leak** to the react layer or users: entities stay plain classes, hook outputs are unchanged, referential-stability contracts hold. This track is benchmark-gated — if immutable tables don't beat cheaper alternatives (native `Map` tables with lazy cloning), we ship the alternative instead and close the ImmutableJS half of this track with an ADR.

**Track B — External ImmutableJS support for `@data-client/normalizr` users.** Users with their own ImmutableJS-based stores (e.g. Redux + Immutable) who drive `normalize`/`denormalize`/`MemoCache` directly. Here ImmutableJS *is* the user-facing contract, including entity values as Immutable Records (`EntityRecord`). Correctness- and docs-focused, not performance-focused.

Key insight separating them: denormalize always converts entity values to plain classes (`createIfValid`/`fromJS`), so Track A only needs **immutable tables with POJO values** — a contract the existing `@data-client/normalizr/imm` layer already implements. `EntityRecord` and the immutable branches of Object/Polymorphic denormalize are **Track B only**.

## Constraints (from GOALS.md — apply to both tracks)

1. **Zero bundle cost for non-users** — all immutable code behind `/imm` subpath exports.
2. **Zero runtime cost for the default path** — no per-call duck-type checks; behavior differences resolved once via policy injection (the `MemoCache(policy)` pattern from 0.15).
3. **SRP / drift protection** — one implementation per concern; immutable semantics in dedicated modules, never inlined into shared schema code.
4. **Track A only**: no ImmutableJS types, values, or APIs observable from `@data-client/react` hooks or user data. Acknowledged soft leak: `controller.getState()` raw state in managers/middleware (documented caveat when the opt-in policy is active).

## Current state (baseline)

- `@data-client/normalizr/imm` exists: `MemoPolicy` (`ImmDelegate`), `normalize`, `denormalize`, `ImmNormalizeDelegate`. `MemoCache` and `Controller` accept injected policies.
- **Supported contract**: outer tables (`entities`/`indexes`/`entitiesMeta`) immutable, entity values POJO. Tested for `Values`, `All`, `Invalidate`, `Query`, `MemoCache`.
- **Known gaps**:
  - `isImmutable`/`denormalizeImmutable` ship in **main** bundles of both normalizr and endpoint (`Object.ts`, `Polymorphic.ts`); per-object hot-path check for everyone. The two `ImmutableUtils.ts` copies have already drifted.
  - Entity values as Records/Maps are broken (`fromJS`/`merge`/`denormalize`/`validate` assume POJOs; corrupt snapshot committed in `packages/normalizr/src/__tests__/__snapshots__/immutable.test.ts.snap`). `EntityRecord.ts` is an empty stub. (Track B)
  - Core reducers/`Controller`/`GCPolicy` and react hooks assume POJO state shape (bracket reads like `state.endpoints[key]`; spreads; in-place GC deletes). (Track A)
  - `normalize.imm.ts` ships a fake-immutable default store (`deepClone`, `createNestedImmutable`).
  - No user-facing docs for immutable usage.

---

## Shared Foundation — Stage F1: evict immutable code from main bundles

Prerequisite for both tracks; creates the policy seam everything else uses.

### Spikes

- **F0.1 — Measure the `isImmutable` hot-path cost.** Microbenchmark in `examples/benchmark/micro.js` isolating object-schema denormalize with/without the check. Sets the regression gate; tells us whether the payoff is perf (0.15 entity-path removal claimed 10–20%) or only bundle/SRP.
- **F0.2 — Prototype the policy seam** for object/polymorphic denormalize: strategy on the unvisit `delegate` vs. resolved at `getUnvisit` construction from `IMemoPolicy`. Must respect the hidden-class/deopt constraints in `packages/normalizr/AGENTS.md`; hold ≤2% on cached `normalizr` benches. Decides whether `Polymorphic`'s discrimination reads (`value.get('schema')`/`value.get('id')`) share the strategy or need their own hook.

### Work items

1. Move the immutable branches of `Object.ts`/`Polymorphic.ts` (both packages) behind the policy; POJO policy performs no check, imm policy supplies immutable-aware implementations.
2. Consolidate the two drifted `ImmutableUtils.ts` copies (or delete if subsumed).
3. Bundle verification (`yarn ci:build:bundlesize`) + a CI grep asserting main entries contain no immutable code.
4. Changeset — **breaking** for anyone denormalizing immutable input via main entries (migrate to `/imm`, same shape as the 0.15 `MemoCache` migration).

**Exit criteria**: no immutable code in main bundles; POJO benches within noise or improved; `/imm` tests green.

---

## Track A — Internal store performance

### Stage A0 — Spikes (A0.1 is the go/no-go gate for the whole track)

- **A0.1 — Three-arm store benchmark (gate).** Compare on `core` suite `^set` filters and memory scenarios, at realistic and adversarial sizes (10k+ entities of one type; thousands of `endpoints`/`meta` keys):
  1. Current POJO tables (lazy per-key clone in `NormalizeDelegate` — already manual structural sharing),
  2. Immutable Map tables (existing `ImmNormalizeDelegate`),
  3. Native `Map` tables with the same lazy-clone strategy (no dependency, no leak risk).

  Measure write throughput, read/denormalize-miss overhead (`getIn` vs. property access), allocation churn, and heap deltas (extend `examples/benchmark` with a memory harness or reuse `benchmark-react` heap-delta methodology). **Decision rule**: ImmutableJS proceeds only if it clearly beats arm 3; otherwise arm 3 (or status quo) becomes the deliverable and A3 pivots accordingly.
- **A0.2 — GC sweep vs. memoization.** The GC reducer mutates in place (`delete state.entities[key][pk]` in `createReducer.ts`) deliberately, preserving table identity so sweeps don't bust `WeakDependencyMap` chains. Immutable `deleteIn` creates a new per-key table map, invalidating memo chains for every entity of that type per sweep. Investigate mitigations (batched sweeps via `withMutations`, GC epochs, accepting and measuring the re-denormalize cost) — outcome feeds the A0.1 decision.
- **A0.3 — State-read audit → accessor API design.** Enumerate every raw state read outside core reducers: react hooks (`state.endpoints[key]`, `state.meta[key]` bracket reads in `useCache`/`useSuspense`/`useFetch`/`useDLE`/`useQuery`; table refs used as `useMemo` deps are identity-only and already shape-agnostic), `ExternalDataProvider`'s optimistic replay, managers, `packages/ssr`, devtools serialization. Design the minimal `Controller` accessor surface (or state facade) that makes them shape-agnostic.

### Stage A1 — React/Controller accessor refactor (independent, zero user-facing change)

Route the hooks' bracket reads through `Controller` accessors per A0.3. Ships on its own — it's a correctness-neutral decoupling that also benefits any future store representation. No changeset-visible behavior change (internal, but verify no public API shifts; if accessors become public API, document them).

**Exit criteria**: `packages/react` contains no POJO-shape assumptions on state; all Jest projects green; react benchmarks within noise.

### Stage A2 — Core store policy seam

Make state-shape-dependent operations in core pluggable via one injected store policy (mirroring `MemoCache(policy)`):

1. `initialState` construction; `setResponseReducer`'s direct POJO `normalize` import → policy-provided normalize/delegate.
2. Reducer table ops: `endpoints`/`meta` spreads in `setResponseReducer`, `invalidateReducer`, `expireReducer`; the GC branch (per A0.2 outcome).
3. Reads in `Controller` (`state.endpoints[key]`, `entityExpiresAt` over `state.entitiesMeta`), `selectMeta`, `GCPolicy`.
4. Serialization hooks for devtools display and `packages/ssr` hydration (toJS/fromJS boundary).

POJO policy is the default with **zero added indirection cost** (verify on `core` `^set`/`^get` benches, ≤2%).

**Exit criteria**: default path benchmark-neutral; policy is the single injection point (no scattered conditionals).

### Stage A3 — Ship the winning store

- If **ImmutableJS won A0.1**: `@data-client/core/imm` exporting the immutable store policy; opt-in wiring through `DataProvider`/`CacheProvider`; `immutable` as optional peer of core. Document the `getState()` caveat for manager authors.
- If **native-Map or status quo won**: land the winner in the main package (no subpath needed — no dependency), write the ADR closing the ImmutableJS internal-store question with benchmark evidence.

Changeset (minor). Docs per docs-in-same-PR policy.

**Exit criteria**: measured wins on the targeted `^set`/memory benchmarks landed in CI history; react benchmark suite shows no regression; zero user-visible data-shape change.

---

## Track B — External `normalizr` + ImmutableJS support

Target user: owns their store (e.g. Redux + Immutable), calls `normalize`/`denormalize`/`MemoCache(ImmPolicy)` directly. Core's internal store is explicitly **not** this track's concern (that's Track A).

### Stage B0 — Spikes

- **B0.1 — `EntityRecord` design.** Prototype an Entity mixin for Immutable Record instances. Decide: composition (override surface on `EntityMixin` statics — `fromJS`, `createIfValid`, `merge`, `mergeWithStore`, `denormalize`, `validate`, `defaults` — vs. parallel mixin); storage shape (Records in the entity table vs. POJO storage + Record construction at denormalize — storage shape is public API per normalizr AGENTS.md; POJO storage is the conservative default); memoization (`toBe` stability with Records across repeated calls and unrelated writes); dependency wiring (`immutable` as optional peer imported only from `/imm`, or stay duck-typed); `/imm` subpath types across the supported TS matrix.
- **B0.2 — Integration reality check.** Minimal Redux + ImmutableJS example driving the `/imm` APIs in a user reducer. Identify demand signal (issues/discussions) and whether a thin outer-state adapter (fixed keys) is needed for `Controller`-based reads in that context.
- **B0.3 — Immutable-input surface matrix.** Audit schema `denormalize`/`queryKey` paths receiving immutable input when entity values are also immutable: `Values` (iterates `Object.keys(input)`), `Collection.createIfValid` (spread), Union/Polymorphic discrimination, `All` table iteration. Deliverable: schema × operation × input-kind table → Stage B1 test matrix.

### Stage B1 — `EntityRecord` + `@data-client/endpoint/imm`

1. Implement per B0.1; new `/imm` subpath in `packages/endpoint` (`exports` wiring, `yarn build:types`).
2. Fix or explicitly reject the mixed case (plain `Entity` with deep-immutable stored values); if rejected, fail loudly in dev instead of silently producing `id: ""` garbage.
3. Tests: convert the corrupt-Record snapshot into real assertions; re-enable the commented-out expectations in `immutable.test.ts`; cover the B0.3 matrix; referential-stability `toBe` tests; all three Jest projects.
4. Changeset (minor) + API reference docs in the same PR.

### Stage B2 — Remove the fake-immutable fallback

Delete `emptyImmutableLike`/`createNestedImmutable`/`deepClone` from `normalize.imm.ts`; require explicit immutable state (anyone importing `/imm` has `immutable`). Changeset (**breaking** for `/imm` `normalize` callers relying on the implicit default). Independent — can land any time after F1.

### Stage B3 — Verification + docs

1. imm-policy benchmark suite in `examples/benchmark` (normalize + memoized denormalize on immutable tables; Record entities after B1).
2. Supported `immutable` version range decision; CI cell for v4 + v5 if the range spans both (`isImmutable` duck-typing against `__ownerID`/`_map` verified on each; devDep pinned 5.1.8 today).
3. Docs guide: `/imm` entries, `EntityRecord`, tables-immutable vs. values-immutable contracts, Redux+ImmutableJS integration (from B0.2). Mark the ROADMAP item done.

---

## Sequencing

```
F0.1, F0.2 ──► F1 (shared foundation)
                │
   ┌────────────┴────────────┐
   ▼ Track A                 ▼ Track B
A0.3 ─► A1 (react accessors) B0.1 ─► B1 (EntityRecord + endpoint/imm)
A0.1 ─┬► A2 (core seam)      B0.2 ─► B3 (docs, CI matrix)
A0.2 ─┘   │                  B0.3 ─► B1
          ▼                  B2 (independent after F1)
        A3 (ship winner)
```

- A1 and B2 are independent and can land early.
- A0.1 is the gate: no core immutable work beyond the (shape-agnostic, independently justified) A1/A2 seams until the benchmark verdict is in.
- Track B has no performance gate — it's a correctness/completeness commitment; scope is bounded by B0.2's demand findings.
- Breaking changes (F1, B2) should land in the same minor release to consolidate migration cost.
