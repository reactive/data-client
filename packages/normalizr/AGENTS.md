# `@data-client/normalizr`: agent notes

What you would get wrong from the source alone when changing `src/memo/`, `src/denormalize/`, `src/interface.ts`, or a schema's `denormalize`.

The memo has a web build and a React Native build. Sections are labeled **Both**, **Web** or **React Native**. Read every section labeled Both, then the row below that matches your change:

| You change                                                                         | Then read                                            | Jest projects                                                                |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Schemas (here or `packages/endpoint/src/schemas/`), `denormalize/`, `interface.ts` | "Args-dependent schemas" if output depends on `args` | ReactDOM, Node and ReactNative (ReactNative runs it against the native memo) |
| `src/memo/MemoCache.ts`, `WeakDependencyMap.ts`, `globalCache.ts`                  | "Web memo", "Keeping the pairs in step"              | ReactDOM and Node                                                            |
| `src/memo/*.native.ts`, `packages/react/src/components/DataStore.native.tsx`       | "React Native memo", "Keeping the pairs in step"     | ReactNative                                                                  |

Goals: the web memo has no avoidable misses (a result lives while its entities do), a small bundle, and speed. The React Native memo allows only the misses listed in "React Native memo", and aims for speed and low memory.

## Data flow of a read (Both)

`MemoCache.query(schema, args, state)` → the query-key cache (`queryKeys`) → `MemoCache.denormalize(schema, input, entities, args)`:

1. `policy.getEntities(entities)` makes one `getEntity` for the whole read.
2. One `GlobalCache` per read. `unvisit` walks the schema; each `Entity` goes through `GlobalCache.getEntity`, which looks up `_getCache` (one `WeakDependencyMap` per entity) and, on a miss, runs `denormalize` and records every dep it reads (`dependencies.push`, `argsKey`).
3. `getResults` looks up `endpoints` (the top-level `WeakDependencyMap`, keyed by `input`); on a miss it computes, then stores the value with its deps.
4. Returns `{ data, paths }`. `paths` drive subscriptions and GC.

Each `WeakDependencyMap` nests one `WeakMap` level per dep on web, and has one level on React Native.

## Memo invariants

**Both.** Every change to `src/memo/`, or to a schema's `denormalize`, keeps these in either build:

1. **Sound hits.** A hit returns only a value computed from exactly these entity objects (`===`; `undefined`, `null` and `INVALID` compare by value) and these `argsKey` results.
2. **Complete dependencies.** Every entity and `argsKey` a computation reads is recorded, including deps replayed from a nested hit, and entities that are missing, `null` or `INVALID`.
3. **Deterministic.** The same reads lead to the same further reads and an equal result. All dependence on args goes through a pure, referentially stable `argsKey` fn.
4. **Complete journey.** A hit's `paths` cover every entity the value depends on. Callers never mutate them.
5. **Weak retention.** A cached value lives only while what it is keyed on is reachable. React Native also caps entries per node.
6. **Stable identity.** The same reads return the same object while it is cached. `useSuspense`, `useCache` and `useQuery` skip re-renders on `===` and tests assert `toBe`, so a cache that writes to a throwaway map and repopulates on the next call breaks this.

What breaks them in practice:

- **Choosing a map from what traversal finds.** Lookup comes first: pick a map, look up, and only on a miss traverse and write.
- **Wrapping or proxying entities on read.** Deps are keyed by entity identity, so every chain misses. A new cache must share the read's one `getEntity`.
- **A new caching dimension on one tier only.** `endpoints` and `_getCache` walk the same store; add it to both, or top-level hits return stale nested values.
- **Several logical cells under one `pk`.** A new object at `entities[key][pk]` invalidates every chain through it, so a write to one cell busts them all.

Accepted limitations; don't "fix" them:

- Results are keyed by the input object, not the schema. Two schemas share a result only if two endpoints share a cache key, which is already a bug.
- Entities past `MAX_ENTITY_DEPTH` (`src/denormalize/unvisit.ts`) are read but not tracked.

## Args-dependent schemas (Both)

A schema whose output depends on `args` registers that in `denormalize` with `delegate.argsKey(fn)`. Reference: `packages/endpoint/src/schemas/Scalar.ts`.

- `fn(args)` is pure, cheap, and returns `string | undefined`. On React Native it also runs during lookups with args meant for other branches; a throw counts as no match.
- `fn` is the cache path key: bind it in the constructor or at module level. An inline arrow makes every lookup miss, and on React Native it also adds a branch per call until the node is dropped.
- Reading `delegate.args` directly adds no dep.
- Store data so `denormalize` can recover the cell from the key, usually by encoding it in `pk` at normalize time.

## Gotchas (Both)

- **Entity classes are functions.** Schema walkers that return early on `typeof !== 'object'` skip every `Entity`; guard with `t === 'object' || t === 'function'`. Walk order: arrays → entries; anything with `.schema` → `.schema` (`EntityMixin`, `Collection`, `Union`, `Query`); plain objects → values; otherwise stop. A walker over definitions that can cycle needs its own visited set (normalize uses `getCheckLoop`).
- **Storage shape is API.** Snapshot tests, SSR payloads and devtools read `entities[key][pk]`; changing it is breaking even if round-trips pass.
- **Hot path.** `getEntity`, `dependencies.push` and the map walk run once per entity, thousands of times per read. One optional field on `EntityPath`/`Dep` cost 5–10% on `getSmallResponse`. Keep one object shape per push site, and hoist `WeakMap.get` out of inner loops.
- **New exports.** After adding one to `src/index.ts`, run `yarn build:types`: Jest stays green while dependents' `tsc` fails.
- **A failing `toBe`** in this package or `packages/endpoint` usually means broken identity, not wrong values.
- **Benchmarks** (thresholds are in the benchmarking rule): build base and head in separate worktrees and alternate runs in one session. Node numbers don't show Hermes GC pauses, so confirm a native speed change on Hermes.

## Web memo

`WeakDependencyMap` nests one `WeakMap` per dep, so a result stays cached exactly while every entity it read is alive. Nothing evicts it, and nothing tells it which store committed. Keep it that way: recency caps or commit tracking add bundle size and can miss, and V8 has no nested-`WeakMap` GC cost to trade them for. CI's compressed-size comment on the PR reports bundle size (`yarn ci:build:bundlesize` locally).

## Keeping the pairs in step

**Web and React Native memo files.** With `COMPILE_TARGET=native`, `WeakDependencyMap.native.ts`, `MemoCache.native.ts` and `globalCache.native.ts` replace the web files, and `@data-client/react` uses `DataStore.native.tsx`.

- Port a change to its twin unless it is about retention, commits or `argsKey` forks (React Native only) or the nested `WeakMap` chain (web only); say which in the PR. Much code is shared verbatim, such as `depKey` and most of `GlobalCache`.
- The pairs export the same API, plus on React Native: `MemoCache.commit()`, an exported `keep()`, and trailing `out`, `children` and `records` parameters that carry (node, entry) pairs for `keep()`.
- `babel.config.js` rewrites `./x.js` to `./x.native.js` when that file exists, so a native file can't import its web twin's values. Type imports are erased, so they're fine.
- After changing `rollup.config.mjs` or `babel.config.js`, build before and after and diff the web `dist/` and `lib/` output; it must not change.

## React Native memo

**Why.** Hermes resolves nested `WeakMap`s one level per stop-the-world marking pass, and each pass rescans every `WeakMap` entry. The web memo nests one `WeakMap` per dep, so a deep result stalls old-generation GC for seconds. Native keeps one level: the first dep is the key, the other deps are stored on the entry and compared with `===`, and `argsKey` results branch on a `Map`.

**Data flow:**

1. Each node (a first dep plus its `argsKey` results) keeps at most three entries: the newest, `committed` and `settled`.
2. Each entry lists the (node, entry) pairs it was built from (`children`); `globalCache.native` records them on every hit and write.
3. `MemoCache` collects each read's own pairs (the result's entry and its query key's) and calls `track()`. If the read's `entities` is the committed one, `track()` pins them at once. Otherwise it buffers them in `reads`: weakly keyed by `entities`, one per node, at most `MAX_PENDING` per store, dropping the earliest past that.
4. `DataStore.native` calls `commit(entities, settled)` from an effect, so only committed renders reach it. `commit()` pins that store's buffered reads with `keep()`, which walks `children` once per entry per commit (`gen`).
5. `settled` is true when no optimistic update is in flight. That pin is what lets the read after an optimistic rollback hit.

**Native invariants**, on top of the memo invariants:

- A committed read's result, every nested value in it, and its query key stay pinned until a later commit replaces them. A pinned entry that was evicted goes back.
- Commit state lives only on one `MemoCache` instance. Don't rely on module-level identity: an app can load both the ESM (`native/`) and CJS (`dist/normalizr.native.js`) builds, which is why `INVALID` is shared through `dist/symbol.native.js`.
- Without `commit()` (a custom `DataProvider`, or `MemoCache` used directly), each node keeps only its newest entry, plus up to `MAX_PENDING` buffered pins per live store.

**When a native read gets a new, equal object** (one recompute; the data is never wrong). A change that adds a case lists it here and tests it in `src/__tests__/MemoCache.native.ts`:

1. Reads that alternate between two or more store versions that never committed, such as discarded renders, or `getResponse()` outside render against a store other than the rendered one.
2. More than `MAX_FORKS` extra `argsKey` branches below one first dep. This happens when missing entities change which `argsKey` comes next; the whole first-dep node is then dropped and rebuilt from this write.
3. More than `MAX_PENDING` distinct results read from one store before it commits; the earliest lose their buffered pin.
