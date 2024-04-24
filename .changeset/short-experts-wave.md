---
"@data-client/endpoint": patch
"@data-client/rest": patch
"@data-client/graphql": patch
---

Queries pass-through suspense rather than ever being undefined

- [useSuspense()](https://dataclient.io/docs/api/useSuspense) return values will not be nullable
- [useQuery()](https://dataclient.io/docs/api/useQuery) will still be nullable due to it handling `INVALID` as `undefined` return
- [Query.process](https://dataclient.io/rest/api/Query#process) does not need to handle nullable cases