---
'@data-client/core': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `Controller.getResponse()` treating cached falsy endpoint responses (`''`, `0`, `false`, and `null`) as missing data, which could cause `useSuspense()` and `useFetch()` to repeatedly refetch schema-less endpoints.
