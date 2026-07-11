# Full ImmutableJS Support — Staged Plan

Status: draft
Owner: TBD
Related: [GOALS.md](../GOALS.md), `docs/ROADMAP.md` ("Immutable.js support as optional peerdep")

## Constraints (from GOALS.md)

1. **Zero bundle cost for POJO users** — all immutable code stays behind `/imm` subpath exports; nothing immutable-related in main entries.
2. **Zero runtime cost for POJO users** — no per-call duck-type checks or branching on the hot path; behavior differences are resolved once via policy/delegate injection (the pattern established by `MemoCache(policy)` in 0.15).
3. **SRP / drift protection** — one implementation per concern; immutable semantics live in dedicated modules, never inlined into shared schema code.

## Current state (baseline)

- `@data-client/normalizr/imm` exists: `MemoPolicy` (`ImmDelegate`), `normalize`, `denormalize`, `ImmNormalizeDelegate`. `MemoCache` and `Controller` accept injected policies.
- **Supported contract**: outer state tables (`entities`/`indexes`/`entitiesMeta`) are Immutable Maps; entity *values* are POJOs. Tested for `Values`, `All`, `Invalidate`, `Query`, `MemoCache`.
- **Known gaps** (details in each stage):
  - Entity values as Immutable Records/Maps are broken (`fromJS`/`merge`/`denormalize`/`validate` in `EntityMixin` assume POJOs; see corrupt snapshot in `packages/normalizr/src/__tests__/__snapshots__/immutable.test.ts.snap`).
  - `isImmutable`/`denormalizeImmutable` ship in **main** bundles of both normalizr and endpoint (`Object.ts`, `Polymorphic.ts`) and run a per-object check on the denormalize hot path for everyone.
  - The two `ImmutableUtils.ts` copies (normalizr, endpoint) have already drifted (different signatures and INVALID handling).
  - `normalize.imm.ts` ships a fake-immutable default store (`deepClone`, `createNestedImmutable`).
  - `packages/endpoint/src/schemas/EntityRecord.ts` is an empty stub.
  - Core (reducers, `GCPolicy`, `Controller` state reads) is POJO-only; no written decision on whether that is in scope.
  - No user-facing docs for immutable usage.

---

## Stage 0 — Spikes and knowledge gathering

No production code changes. Each spike de-risks a later stage; results get recorded in this document before the dependent stage starts.

### S0.1 Measure the `isImmutable` hot-path cost (feeds Stage 1)

- Add a microbenchmark to `examples/benchmark/micro.js` isolating object-schema denormalize with and without the `isImmutable(input)` check (hack it out locally; don't commit the removal).
- Establishes the expected payoff for Stage 1 and the baseline for its regression gate.
- **Question answered**: is the win measurable (the 0.15 entity-path removal claimed 10–20%), or is it noise on modern V8? Either result is useful — if noise, Stage 1 is justified by bundle size and SRP alone and we shouldn't oversell it in the changeset.

### S0.2 Prototype the policy seam for object/polymorphic denormalize (feeds Stage 1)

- The immutable branch in `Object.ts`/`Polymorphic.ts` must move behind the injected policy. Prototype where the strategy lives: on the unvisit `delegate` (one object per denormalize tree) vs. resolved at `getUnvisit` construction from `IMemoPolicy`.
- **Constraints to verify** (per `packages/normalizr/AGENTS.md`): adding fields to hot-path objects changes hidden classes and has measured 5–10% costs; conditional call-site shapes deopt. The prototype must run `yarn workspace example-benchmark start normalizr` and hold ≤2% on cached benches.
- **Question answered**: exact seam shape, and whether `Polymorphic`'s discrimination reads (`value.get('schema')`, `value.get('id')`) can share the same strategy or need their own hook.

### S0.3 Enumerate immutable-input surfaces under the supported contract (feeds Stages 1–2)

- Audit which schema `denormalize`/`queryKey` paths can ever receive immutable input when (a) only tables are immutable, (b) entity values are also immutable. Known suspects beyond Object/Polymorphic: `Values` (iterates `Object.keys(input)`), `Collection.createIfValid` (spread), `All` (table iteration — `ImmDelegate.getEntities` already returns the Immutable Map, which is iterable-compatible).
- Deliverable: a table of schema × operation × input-kind, marking which need policy-routed handling and which are already safe. This becomes the Stage 2 test matrix.

### S0.4 `EntityRecord` design spike (feeds Stage 2)

Prototype an Entity mixin whose instances are Immutable Records. Questions that must be answered before committing to an API:

- **Composition**: extend/wrap `EntityMixin` overriding statics (`fromJS`, `createIfValid`, `merge`, `mergeWithStore`, `denormalize`, `validate`, `defaults`), or a parallel mixin sharing helpers? Prefer the smallest override surface that avoids duplicating normalize logic.
- **Storage shape**: do Record instances go *into* the entity table, or do we normalize to POJOs and only construct Records at denormalize time? Storage shape is public API (snapshot tests, SSR payloads, devtools) — POJO storage is the conservative default and keeps `mergeWithStore` trivial; Record storage would need Record-aware merge and meta handling. Decide with evidence.
- **Memoization**: `WeakDependencyMap` chains are keyed by entity object identity. Verify referential-stability contracts hold (`toBe` across repeated `MemoCache.denormalize` calls) with Records, including after unrelated store writes.
- **Immutable dependency**: `immutable` becomes an optional `peerDependency` (with `peerDependenciesMeta.optional`) imported **only** from the `/imm` entry — verify no accidental graph reachability from the main entry. Check whether we need actual imports at all or can stay duck-typed like `ImmutableUtils` does today (types-only import may suffice).
- **Types**: confirm the `/imm` subpath types pattern (as done in normalizr's `package.json` `exports`) works across the supported TS matrix, and decide whether legacy `typesVersions` (3.4/4.0/4.1) get the export or it's TS ≥5.x-only.

### S0.5 External immutable-store integration reality check (feeds Stage 4)

- Build a minimal Redux + ImmutableJS example driving `MemoCache(ImmPolicy)` + `/imm` `normalize` in a user reducer. Identify exactly which `Controller` reads break when the *outer* state object is immutable (`state.endpoints[key]`, `state.meta[...]`, `GCPolicy` reads).
- Search issues/discussions for actual demand signal for an immutable *internal* store vs. external-store interop.
- **Question answered**: is a thin outer-state adapter (fixed keys: `entities`, `endpoints`, `indexes`, `meta`, `entitiesMeta`, `optimistic`, `lastReset`) sufficient for real integrations, making a `@data-client/core/imm` unnecessary?

---

## Stage 1 — Evict immutable code from main bundles; consolidate `ImmutableUtils`

**Depends on**: S0.1, S0.2, S0.3.

**Why**: constraints 1–3 are currently violated on the object/polymorphic path; this also creates the seam Stage 2 builds on.

Work items:

1. Move the immutable branch of `Object.ts` and `Polymorphic.ts` denormalize (both packages) behind the policy seam chosen in S0.2. POJO policy performs no check; imm policy supplies the immutable-aware implementations.
2. Consolidate the two drifted `ImmutableUtils.ts` copies into a single implementation, living with the imm policy code (or delete entirely if the policy move subsumes them).
3. Bundle verification: `yarn ci:build:bundlesize`; assert main entries of normalizr and endpoint contain no `isImmutable`/immutable branches (add a grep-based check to CI if cheap).
4. Benchmarks: `normalizr` suite `^denormalize` filters, plus the S0.1 microbenchmark as the before/after evidence.
5. Changeset (likely **breaking** for anyone denormalizing immutable input through the *main* entry — they must switch to `/imm`, same migration shape as the 0.15 `MemoCache` change).

**Exit criteria**: no immutable code in main bundles; POJO benches within noise or improved; existing `/imm` tests green; drift eliminated (one implementation).

## Stage 2 — `EntityRecord` and `@data-client/endpoint/imm`

**Depends on**: Stage 1 (seam), S0.3 (test matrix), S0.4 (design decisions).

**Why**: this is the actual "full support" feature gap — immutable entity *values* are currently corrupt (the committed snapshot proves it).

Work items:

1. Implement `EntityRecord` per the S0.4 design in `packages/endpoint`, exported from a new `/imm` subpath (`package.json` `exports`, build wiring, `yarn build:types`).
2. `immutable` as optional peer dependency of `@data-client/endpoint` (or stay duck-typed if S0.4 shows imports are unnecessary).
3. Fix or explicitly reject the mixed case: plain `Entity` classes with deep-immutable stored values. If rejected, `fromJS` should fail loudly in dev rather than silently producing `id: ""` garbage.
4. Tests: convert the corrupt-Record snapshot into real assertions; re-enable the commented-out denormalize expectations in `immutable.test.ts`; cover the S0.3 matrix (Collection push/unshift, Union discrimination, Values, All) with Record entities; referential-stability `toBe` tests. All three Jest projects (Node, ReactDOM, ReactNative).
5. Docs in the same PR (see Stage 5 for the guide; API reference for `EntityRecord` lands here per the docs-in-same-PR policy).
6. Changeset (minor — new feature).

**Exit criteria**: Record-based entities normalize, merge, and denormalize correctly with memoization intact; zero main-bundle growth; no new peer warnings for non-users.

## Stage 3 — Remove the fake-immutable fallback from `normalize.imm.ts`

**Depends on**: nothing (can run parallel to Stage 2). No spike needed — the design question is small.

Work items:

1. Delete `emptyImmutableLike`, `createNestedImmutable`, and `deepClone`; require explicit immutable state (anyone importing `/imm` has `immutable` available) or accept an injected empty-state factory.
2. Changeset (**breaking** for `/imm` `normalize` callers relying on the implicit default).

**Exit criteria**: `/imm` bundle shrinks; no POJO shim masquerading as immutable state.

## Stage 4 — Core scope decision (ADR) + external-store adapter if warranted

**Depends on**: S0.5.

**Why**: "full support" needs a written boundary, or scope will creep into an immutable internal store that fights the performance goal.

Work items:

1. Write an ADR (this folder): immutable support targets **external stores**; core's internal store stays POJO. Cite GOALS.md performance priorities and S0.5 findings.
2. If S0.5 showed real integrations need it: ship the thin outer-state adapter (or document the hand-rolled equivalent) so `Controller.getResponse`/`GCPolicy` work against immutable outer state. This should be a few lines per fixed key, not a core rewrite.
3. Publish the S0.5 example as `examples/` entry or docs snippet.

**Exit criteria**: the boundary is documented and discoverable; the supported integration path has a working, tested example.

## Stage 5 — Verification infrastructure and docs

**Depends on**: Stages 1–2 (content to document and guard).

Work items:

1. **Benchmarks**: add an imm-policy suite to `examples/benchmark` (normalize + memoized denormalize against Immutable tables, and Record entities once Stage 2 lands) plus a POJO-path guard so "zero cost to non-users" is CI-enforced, not asserted. Keep names stable for history.
2. **Bundle guard**: CI assertion that main entries contain no immutable code (from Stage 1, item 3).
3. **Version matrix**: decide the supported `immutable` peer range; if it spans v4 and v5, add a CI cell (devDep is pinned 5.1.8 today; `isImmutable` duck-typing (`__ownerID`, `_map`) must be verified against both).
4. **Docs**: a guide covering the `/imm` entries, `EntityRecord`, the tables-immutable vs. values-immutable contracts, and the Redux+ImmutableJS integration; link from ROADMAP (and mark the roadmap item done). Follow the packages-documentation skill for placement/format.

**Exit criteria**: a regression in bundle size, POJO perf, or immutable correctness fails CI; a new user can integrate from docs alone.

---

## Sequencing summary

```
S0.1 ─┐
S0.2 ─┼─► Stage 1 ─► Stage 2 ─► Stage 5
S0.3 ─┘              ▲
S0.4 ────────────────┘
S0.5 ─────► Stage 4          Stage 3 (independent, anytime)
```

Every stage that touches `packages/*` needs a changeset; Stages 1 and 3 are breaking for `/imm`-adjacent users and should ideally land in the same minor release to consolidate migration cost.
