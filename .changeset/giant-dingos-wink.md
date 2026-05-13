---
'@data-client/core': patch
---

Fix `Controller.getResponse()` treating cached falsy endpoint responses (`''`, `0`, `false`, and `null`) as missing data, which could cause `useSuspense()` and `useFetch()` to repeatedly refetch schema-less endpoints.
