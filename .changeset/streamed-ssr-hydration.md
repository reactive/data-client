---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': patch
---

Stream SSR store state incrementally and hydrate each island from its own generation.

The shell carries an inert baseline. Each later committed server revision emits a
StateDelta. The client folds that piece into the hydration snapshot and HYDRATE
before that island’s useSuspense() may fetch. Several components in one flush
share one delta; a nested child can hydrate before its parent; a later delta may
overlap an entity already in the store (three-way merge). A key that is still
missing while the initial stream is open waits on that key rather than
refetching. SUBSCRIBE after commit starts live updates and does not gate REST.

Next.js App Router and generic Fizz share this protocol. HTML insertion order is
not a Flight clock; a per-key waiter covers that race.

Hooks hydrate from the server snapshot so a late Suspense boundary does not
mismatch the live store.

New exports: actionTypes.HYDRATE / HydrateAction, StateDelta, StateBaseline,
NextDataProviderProps. ActionTypes includes HydrateAction — exhaustive Manager
switches need a case or default.
