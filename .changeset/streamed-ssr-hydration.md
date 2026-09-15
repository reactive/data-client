---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': patch
---

Stream SSR store state incrementally and hydrate each island from its own generation.

The shell carries an inert baseline. Each later committed server revision emits a
StateDelta. The client folds that piece into the hydration snapshot and HYDRATE
from the receiver layout effect. Several components in one flush share one delta;
a nested child can hydrate before its parent; a later delta may overlap an entity
already in the store (three-way merge). SUBSCRIBE after commit starts live updates
and does not gate REST.

Next.js App Router emits this protocol. HTML insertion order is not an RSC clock;
a Client Component may start before its delta script runs, and a miss then fetches
like any client render. Per-key waiters that would suppress that refetch are not
in this release. Generic `renderToPipeableStream` remains a one-shot document snapshot.

Hooks hydrate from the server snapshot so a late Suspense boundary does not
mismatch the live store.

New exports: actionTypes.HYDRATE / HydrateAction, StateDelta, StateBaseline,
NextDataProviderProps. ActionTypes includes HydrateAction — exhaustive Manager
switches need a case or default.
