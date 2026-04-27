# `@data-client/normalizr` — agent notes

Non-obvious constraints when changing `src/memo/`, `src/denormalize/`, or `src/interface.ts`. Read the source for the rest.

## Correctness constraints

- **Referential equality is a contract.** Successive `MemoCache.denormalize` calls with identical inputs must return the same object reference. `useSuspense`/`useCache`/`useQuery` skip re-renders on `===`, and many tests assert `toBe`. Probe-and-discard caching schemes (write to a throwaway cache, "real" cache repopulates next call) silently break this.
- **`WeakDependencyMap` entity links are identity-keyed.** Entity deps live on a `WeakMap` keyed by the entity object; `argsKey` deps live on a parallel `Map` keyed by `fn(args)` strings branching off a stable function ref (see `WeakDependencyMap.ts` `next` / `nextStr`). Cache hits on the entity segment depend on every ref in the recorded chain being `===` to the live walk's refs — anything that wraps/proxies refs on read defeats memoization. Variants that introduce new caches (buckets, scopes) must share the same `getEntity` (the `DenormGetEntity` from `IMemoPolicy.getEntities(entities)`) so chain refs stay coherent.
- **Both MemoCache tiers must stay coherent** — `endpoints` (top-level) and `_getCache` (per-entity) walk against the same store. Any new caching dimension applies to both, or top-level hits return stale per-entity values.
- **Cache lookup precedes traversal.** Pick `WeakDependencyMap` → look up → on miss, traverse and write. You can't decide which map to use *based on* what the traversal observes. Discover-then-lookup designs need either a separate pre-scan or a `setRaw`-style promotion primitive (doesn't exist yet).
- **Storage shape is API.** `state.entities[key][pk]` is observed by snapshot tests, SSR payloads, and devtools. Shape changes are breaking even when normalize/denormalize round-trip correctly.
- **Cache invalidation is reference-driven.** A new object at `entities[key][pk]` busts every chain through that step. Storing multiple logical cells under one `pk` invalidates them all on any single-cell write.

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
