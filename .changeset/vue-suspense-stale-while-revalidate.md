---
'@data-client/vue': patch
---

Fix Vue `useSuspense()` suspending on stale data instead of showing it while it refetches

When a component mounted with cached data that was past its `dataExpiryLength` but still valid, `await useSuspense()`
waited for the refetch, so users saw the `<Suspense>` fallback instead of the data already on hand. Now, like React,
it renders the stale data right away and updates once the refetch resolves. Data that is missing, invalidated, or
[invalidIfStale](https://dataclient.io/rest/api/Endpoint#invalidifstale) still waits for the fetch.
