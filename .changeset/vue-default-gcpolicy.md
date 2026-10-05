---
'@data-client/vue': patch
---

Fix `DataClientPlugin` never garbage collecting by default

Without a `gcPolicy` option, every response stayed in the store for the life of the app, so long-running
pages kept growing. It now defaults to `new GCPolicy()`, matching `DataProvider` in `@data-client/react`.

Data that no mounted component uses is removed once it is stale (checked every 5 minutes). A component that
mounts after that refetches it with `useSuspense()`, while `useCache()` returns `undefined` until something fetches
it again. Pass your own `gcPolicy` to keep unused data longer or sweep less often.
