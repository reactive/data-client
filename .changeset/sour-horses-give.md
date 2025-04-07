---
'@data-client/core': minor
'@data-client/test': minor
---

Change NetworkManager bookkeeping data structure for inflight fetches

BREAKING CHANGE: NetworkManager.fetched, NetworkManager.rejectors, NetworkManager.resolvers, NetworkManager.fetchedAt
  -> NetworkManager.fetching


#### Before

```ts
if (action.key in this.fetched)
```

#### After

```ts
if (this.fetching.has(action.key))
```