# `@data-client/normalizr` — agent notes

Non-obvious constraints when changing `src/memo/`, `src/denormalize/`, or `src/interface.ts`. Read the source for the rest.

## Correctness constraints

- **Referential equality is a contract.** Successive `MemoCache.denormalize` calls with identical inputs must return the same object reference. `useSuspense`/`useCache`/`useQuery` skip re-renders on `===`, and many tests assert `toBe`. Probe-and-discard caching schemes (write to a throwaway cache, "real" cache repopulates next call) silently break this.
- **`WeakDependencyMap` entity links are identity-keyed.** Entity deps live on a `WeakMap` keyed by the entity object; `argsKey` deps live on a parallel `Map` keyed by `fn(args)` strings branching off a stable function ref (see `WeakDependencyMap.ts` `next` / `nextStr`). Cache hits on the entity segment depend on every ref in the recorded chain being `===` to the live walk's refs — anything that wraps/proxies refs on read defeats memoization. Variants that introduce new caches (buckets, scopes) must share the same `getEntity` (the `DenormGetEntity` from `IMemoPolicy.getEntities(entities)`) so chain refs stay coherent.
- **Both MemoCache tiers must stay coherent** — `endpoints` (top-level) and `_getCache` (per-entity) walk against the same store. Any new caching dimension applies to both, or top-level hits return stale per-entity values.
- **Cache lookup precedes traversal.** Pick `WeakDependencyMap` → look up → on miss, traverse and write. You can't decide which map to use *based on* what the traversal observes. Discover-then-lookup designs need either a separate pre-scan or a `setRaw`-style promotion primitive (doesn't exist yet).
- **Storage shape is API.** `state.entities[key][pk]` is observed by snapshot tests, SSR payloads, and devtools. Shape changes are breaking even when normalize/denormalize round-trip correctly.
- **Cache invalidation is reference-driven.** A new object at `entities[key][pk]` busts every chain through that step. Storing multiple logical cells under one `pk` invalidates them all on any single-cell write.

## Memo invariants

Every change to `src/memo/`, or to a schema's `denormalize`, must keep these. Tests: `src/__tests__/WeakDependencyMap.test.ts` (web), `src/__tests__/WeakDependencyMap.native.ts` (React Native), `src/__tests__/MemoCache.ts`, `packages/react/src/__tests__/concurrent-memo.web.tsx`.

1. **Sound hits.** A hit returns only a value computed from exactly these entity objects (`===`; non-object values such as `undefined`, `null` and `INVALID` compare by value) and these `argsKey` results.
2. **Complete dependencies.** Every entity and `argsKey` a computation reads is recorded, including deps replayed from a nested hit, and including entities that are missing, `null` or `INVALID`.
3. **Deterministic.** The same reads lead to the same further reads and an equal result. All args-dependence goes through a pure, referentially stable `argsKey` fn.
4. **Complete journey.** The paths returned with a hit cover every entity the value depends on; subscriptions and GC count refs from them. Callers never mutate it.
5. **Weak retention.** A cached value lives only while what it is keyed on is reachable. (React Native also bounds it; see "React Native memo".)
6. **Stable identity.** The same reads return the same object while it is cached.

Accepted limitations (intentional; don't "fix"):

- The results cache is keyed by the input object, not the schema. Two schemas only see the same result object if two endpoints share a cache key, which is already a bug in the endpoints.
- Entities past `MAX_ENTITY_DEPTH` (`src/denormalize/unvisit.ts`) are read but not tracked, so changes that deep don't invalidate ancestors.

## React Native memo

`src/memo/WeakDependencyMap.native.ts` replaces `WeakDependencyMap.ts` in React Native builds. Both export the same API. Keep them in step: a change to one needs the same change, or a reason it does not apply, in the other.

- **Why.** Hermes resolves nested `WeakMap`s one level per stop-the-world marking pass, and each pass rescans every `WeakMap` entry in the heap. The web memo nests one `WeakMap` per dependency, so a result with N dependencies costs N passes per old-generation collection (0.5–3s freezes with a few thousand entities). The native memo keeps one `WeakMap` level: the first dependency is the key, and the rest are stored on the entry and compared with `===` on `get`. `argsKey` results branch on a `Map`, one branch per `argsKey` fn.
- **Bounded retention.** Invariant 5 changes on native: a value lives only while its first dependency is reachable, and each (first dependency, `argsKey` results) keeps at most `MAX_ENTRIES` (6) values, most recently used first. One of them is never evicted: the value the store last flipped back to (a read of a value that is not the newest), or the first value until a flip happens. Each entry can hold a whole stale result, so a larger cap costs memory while a large result streams (`memo-tradeoffs` in #4459: about 3.8 MB per entry for 3,736 symbols).
- **Build.** `babel.config.js` rewrites `./x.js` imports to `./x.native.js` when `COMPILE_TARGET=native` and the file exists. `build:js:native` uses this to make `dist/normalizr.native.js` (CommonJS). The `react-native` export condition is listed before `import` and `require`, because Metro and the React Native Jest preset take the first condition that matches, and they always match `import` or `require`. `lib/` and `legacy/` also contain `WeakDependencyMap.native.js`, but no web file imports it.
- **Tests.** `src/__tests__/WeakDependencyMap.native.ts` runs in the ReactNative Jest project, which resolves `.native.ts` first. Keep `MAX_ENTRIES` in that file equal to the source.

### When a native read gets a new object

On the web, a read of entity versions that the memo already saw always returns the same object while those entities are alive. On native, it returns a new, equal object in these cases only:

1. **Too many newer versions.** Since the last read of a version, `MAX_ENTRIES - 1` (5) or more other versions of the same result (same first dependency and `argsKey` results) were computed, and the version is not the kept one. In React this needs five or more one-off renders between two reads of one committed store, for example many transition retries or optimistic updates in flight while the committed store is not read.
2. **Too many `argsKey` routes.** A first dependency gets more than `MAX_FORKS` (8) extra `argsKey` branches. This happens only when missing entities change which `argsKey` a computation reaches first. The memo then drops every value under that first dependency.

Measured with `packages/react/src/__tests__/concurrent-memo.web.tsx` and the native memo in place of the web one (3,000 random runs with up to 16 optimistic updates and 8 transitions in flight on 3 rows, plus the scripted scenarios):

| `MAX_ENTRIES` | committed reads that miss | all reads that miss | scripted scenarios with a committed miss |
| --- | --- | --- | --- |
| 4 | 0.027% (157 of 584,584) | 0.28% | 4 |
| **6** | **0.007% (41 of 584,584)** | **0.13%** | **1** |
| 8 | 0.003% (15 of 584,584) | 0.075% | 1 |
| web | 0 | 0 | 0 |

The scripted scenario that still misses at 6 (and at 8, 10 and 12) is "ten optimistic updates rolled back, after a transition committed and two later writes": the kept value is from before the transition, and the ten updates compute more than five versions before the store returns to the committed one. It misses once per reader.

## Schema-tree traversal pattern

When walking the schema *definition* (not data), the canonical recursion is used in many places. Keep it consistent:

1. Arrays — recurse entries.
2. Objects/functions with a `.schema` property — recurse into `.schema`. Covers `EntityMixin`, `Collection`, `Union`, `Query`.
3. Plain object literals (`Object.prototype` or `null` proto) — recurse values.
4. Otherwise terminate.

Cycle detection during normalize uses `getCheckLoop` (`src/normalize/getCheckLoop.ts`), which tracks `(entityKey, pk) → Set<input>`. Custom definition walkers that could loop (e.g. `User.posts → Post.author → User`) should carry their own visited set; there is no shared `WeakSet`.

**Entity classes are functions** (`typeof === 'function'`). Walkers that early-return on `typeof !== 'object'` skip every Entity. The correct guard is `t === 'object' || t === 'function'`.

## Hot-path V8 constraints

`getEntity`, `dependencies.push`, and the `WeakDependencyMap` walk run once per resolved entity. Apps resolve thousands per call.

- Adding an optional field to `EntityPath`/`Dep` changes hidden classes and degrades inline caches across consumers — measured 5–10% on `getSmallResponse` from one optional field.
- Per-dep `WeakMap.get` is measurable. Hoist out of the inner loop; cache on schema *classes* (one-time init) when possible.
- Conditional `dependencies.push` shapes (different object literals on different branches) deopt the call site — keep one shape, vary contents outside the call.
- Target ≤2% on cached benches for any addition.

## Args-dependent schemas

Schemas whose denormalized output depends on per-call `args` (not just stored data) must register that dependency inside `denormalize` via `delegate.argsKey(fn)`:

```ts
denormalize(input, delegate) {
  const lens = delegate.argsKey(this.lensSelector); // this.lensSelector is ctor-bound
  if (lens === undefined) return undefined;
  // Encode the bucket key in your stored pk at normalize time, then unvisit:
  return delegate.unvisit(this, buildCompoundPk(input, lens));
}
```

See `packages/endpoint/src/schemas/Scalar.ts` (`denormalize`) for the reference implementation.

Contract:

- `fn(args)` must be pure and return a `string | undefined` bucket key.
- `fn` must be **referentially stable** — it's the cache *path key* on `WeakDependencyMap`. Bind it in the constructor or module-level; never an inline arrow re-created per call. Inline functions make every cache lookup miss.
- `argsKey` returns `fn(args)` for convenience (same value `set` will recompute for the chain).
- Reading `delegate.args` directly does **not** contribute to memoization — only `argsKey` adds a dep.
- Storage shape must let `denormalize` recover the right cell from the bucket key (typically by encoding it into `pk` at normalize time). `Scalar` is the reference implementation.

Under the hood: `argsKey` pushes `{path: fn, entity: undefined}` onto the current `GlobalCache` frame; `WeakDependencyMap` branches function-typed paths via a lazy `Map<string, Link>` alongside the usual `WeakMap<K, Link>`. See `src/memo/WeakDependencyMap.ts` (`KeyFn`, `hasStringDeps`) and `src/memo/globalCache.ts` (`argsKey`, `_hasArgsKey`) for the fast-path gating.

Schemas without args-dependence need no opt-in. When no `argsKey` fires in a frame, `GlobalCache.paths`/`getResults` take the entity-only fast path (gated on `_hasArgsKey` and `WeakDependencyMap.hasStringDeps`).

## Tests

Memo changes usually need all three Jest projects (Node, ReactDOM, ReactNative). Tests in this package and `packages/endpoint` assert exact `entities` shapes and use `toBe` heavily — failures there often mean broken referential equality, not broken values.

## Benchmarks

`yarn workspace example-benchmark start normalizr` and `yarn workspace example-benchmark start core`. Thermal noise is large (5–10% on cached paths after sustained runs). Methodology:

1. Stash → 5 runs HEAD → save.
2. Restore → rebuild `examples/benchmark` → 5 runs → save.
3. Compare with trimmed mean (drop min and max). ≤3% same-session is noise.
4. Never compare against historical baselines from a previous session.

## Build artifacts

After adding a new export to `src/index.ts`, run `yarn build:types` from the workspace root — Jest's source-mapped imports keep tests green while dependent packages' `tsc` fails on the missing declaration.
