# `@data-client/normalizr`: agent notes

What you would get wrong from the source alone when changing `src/memo/`, `src/denormalize/`, `src/interface.ts`, or a schema's `denormalize`.

## Data flow of a read

`MemoCache.query(schema, args, state)` → `buildQueryKey` (cached in `queryKeys`) → `MemoCache.denormalize(schema, input, entities, args)`:

1. `policy.getEntities(entities)` makes one `getEntity` for the whole read.
2. One `GlobalCache` per read. `unvisit` walks the schema; each `Entity` goes through `GlobalCache.getEntity`, which looks up `_getCache` (one `WeakDependencyMap` per entity) and, on a miss, runs `denormalize` and records every dep it reads (`dependencies.push`, `argsKey`).
3. `getResults` looks up `endpoints` (the top-level `WeakDependencyMap`, keyed by `input`); on a miss it computes, then stores the value with its deps.
4. Returns `{ data, paths }`. `paths` drive subscriptions and GC.

Lookup always comes before traversal: pick a map, look up, and on a miss traverse and write. You cannot choose the map from what the traversal finds.

## Memo invariants

Every change to `src/memo/`, or to a schema's `denormalize`, keeps these:

1. **Sound hits.** A hit returns only a value computed from exactly these entity objects (`===`; `undefined`, `null` and `INVALID` compare by value) and these `argsKey` results.
2. **Complete dependencies.** Every entity and `argsKey` a computation reads is recorded, including deps replayed from a nested hit, and entities that are missing, `null` or `INVALID`.
3. **Deterministic.** The same reads lead to the same further reads and an equal result. All dependence on args goes through a pure, referentially stable `argsKey` fn.
4. **Complete journey.** A hit's `paths` cover every entity the value depends on. Callers never mutate them.
5. **Weak retention.** A cached value lives only while what it is keyed on is reachable. React Native also bounds it (see below).
6. **Stable identity.** The same reads return the same object while it is cached. `useSuspense`, `useCache` and `useQuery` skip re-renders on `===` and tests assert `toBe`, so a cache that writes to a throwaway map and repopulates on the next call breaks this.

What breaks them in practice:

- **Wrapping or proxying entities on read.** Deps are keyed by entity identity, so every chain misses. A new cache must share the read's one `getEntity`.
- **A new caching dimension on one tier only.** `endpoints` and `_getCache` walk the same store; add it to both, or top-level hits return stale nested values.
- **Several logical cells under one `pk`.** A new object at `entities[key][pk]` invalidates every chain through it, so a write to one cell busts them all.

Accepted limitations; don't "fix" them:

- Results are keyed by the input object, not the schema. Two schemas share a result only if two endpoints share a cache key, which is already a bug.
- Entities past `MAX_ENTITY_DEPTH` (`src/denormalize/unvisit.ts`) are read but not tracked.

## Args-dependent schemas

A schema whose output depends on `args` registers that in `denormalize` with `delegate.argsKey(fn)`. Reference: `packages/endpoint/src/schemas/Scalar.ts`.

- `fn(args)` is pure and returns `string | undefined`.
- `fn` is the cache path key: bind it in the constructor or at module level. An inline arrow makes every lookup miss.
- Reading `delegate.args` directly adds no dep.
- Store data so `denormalize` can recover the cell from the key, usually by encoding it in `pk` at normalize time.
- Reads with no `argsKey` take the entity-only fast path (`GlobalCache._hasArgsKey`, `WeakDependencyMap.hasStringDeps`).

## React Native memo

With `COMPILE_TARGET=native`, `WeakDependencyMap.native.ts`, `MemoCache.native.ts` and `globalCache.native.ts` replace the web files, and `@data-client/react` uses `DataStore.native.tsx`. Each pair has the same API, except that the native `MemoCache` adds `commit()`. A change to one file of a pair needs the same change in the other, or a reason it does not apply.

**Why.** Hermes resolves nested `WeakMap`s one level per stop-the-world marking pass, and each pass rescans every `WeakMap` entry. The web memo nests one `WeakMap` per dep, so a deep result stalls old-generation GC for seconds. Native keeps one level: the first dep is the key, the other deps are stored on the entry and compared with `===`, and `argsKey` results branch on a `Map`.

**Data flow on native:**

1. Each node (a first dep plus its `argsKey` results) keeps at most three entries: the newest, `committed` and `settled`.
2. Each entry lists the (node, entry) pairs it was built from (`children`); `globalCache.native` records them on every hit and write.
3. `MemoCache` collects each read's own pairs (the result's entry and its query key's) and calls `track()`. If the read's `entities` is the committed one, `track()` pins them at once. Otherwise it buffers them in `reads`: weakly keyed by `entities`, one per node, at most `MAX_PENDING` (256) per store, dropping the earliest past that.
4. `DataStore.native` calls `commit(entities, settled)` from an effect, so only committed renders reach it. `commit()` pins that store's buffered reads with `keep()`, which walks `children` once per entry per commit (`gen`).
5. `settled` is true when no optimistic update is in flight. That pin is what lets the read after an optimistic rollback hit.

**Native invariants**, on top of the six above:

- A committed read's result, every nested value in it, and its query key stay pinned until a later commit replaces them. A pinned entry that was evicted goes back.
- Commit state lives only on one `MemoCache` instance. Metro loads two normalizr copies (core requires the CJS one, the app imports the ESM one), so module-level identity is a bug unless it is shared the way `INVALID` is (`dist/symbol.native.js`).
- Without `commit()` (a custom `DataProvider`, or `MemoCache` used directly), only the newest entry stays.

**When a native read gets a new, equal object** (one recompute; the data is never wrong):

1. Reads that alternate between two or more store versions that never committed, such as discarded renders, or `getResponse()` outside render against a store other than the rendered one.
2. More than `MAX_FORKS` (8) extra `argsKey` branches under one first dep. This happens only when missing entities change which `argsKey` comes first; that node is then dropped.
3. More than 256 reads of one uncommitted store; the earliest lose their buffered pin.

`packages/react/src/__tests__/concurrent-memo.web.tsx` with the native memo, 3,000 random runs: 0 committed and 0 nested committed misses.

**Build.** `babel.config.js` rewrites `./x.js` to `./x.native.js` when `COMPILE_TARGET=native` and that file exists, so a native file cannot import its own web twin. This builds `native/` (ESM, for Metro) and `dist/normalizr.native.js` (CJS, for core and Jest). The `react-native` export condition comes before `import` and `require`, because Metro takes the first match.

## Gotchas

- **Entity classes are functions.** Schema walkers that return early on `typeof !== 'object'` skip every `Entity`; guard with `t === 'object' || t === 'function'`. Walk order: arrays → entries; anything with `.schema` → `.schema` (`EntityMixin`, `Collection`, `Union`, `Query`); plain objects → values; otherwise stop. A walker over definitions that can cycle needs its own visited set (normalize uses `getCheckLoop`).
- **Storage shape is API.** Snapshot tests, SSR payloads and devtools read `entities[key][pk]`; changing it is breaking even if round-trips pass.
- **Hot path.** `getEntity`, `dependencies.push` and the map walk run once per entity, thousands of times per read. One optional field on `EntityPath`/`Dep` cost 5–10% on `getSmallResponse`. Keep one object shape per push site, and hoist `WeakMap.get` out of inner loops. Aim for at most 2% on cached benchmarks.
- **New exports.** After adding one to `src/index.ts`, run `yarn build:types`: Jest stays green while dependents' `tsc` fails.
- **A failing `toBe`** in this package or `packages/endpoint` usually means broken identity, not wrong values.

## Testing and benchmarks

- Memo changes need all three Jest projects (Node, ReactDOM, ReactNative). Invariant tests: `src/__tests__/WeakDependencyMap.test.ts`, `WeakDependencyMap.native.ts`, `MemoCache.ts`, `MemoCache.native.ts`, and `packages/react/src/__tests__/concurrent-memo.web.tsx`.
- Benchmarks: `yarn workspace example-benchmark start normalizr` (or `core`). Build base and head in separate worktrees, run them alternately in one session (5 runs each), and compare trimmed means (drop min and max). Differences up to 3% in one session are noise; never compare with an earlier session. For native code, build with `COMPILE_TARGET=native`.
