---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': patch
---

Stream SSR store state incrementally through adapter-owned composition.

The shell carries an inert baseline. Each later committed server revision emits a
StateDelta. Next.js App Router folds that piece into an adapter-owned snapshot
and publishes it from the receiver layout effect. Several components in one
flush share one delta; a nested child can become readable before its parent; a
later delta may overlap an entity already in the store (three-way merge).
SUBSCRIBE after commit starts live updates and does not gate REST.

Public DataProvider keeps the master store and StateContext reads. Streaming
reducers and snapshot stores stay in ./nextjs and an unstable
`@data-client/react/ssr` `__INTERNAL__` composition seam. HTML insertion order
is not an RSC clock; a Client Component may start before its delta script runs,
and a miss then fetches like any client render. Per-key waiters, revision
visibility, schema-aware streamed merge, and reset-aware overlay are not in this
release.

New exports: StateDelta, StateBaseline, NextDataProviderProps.
