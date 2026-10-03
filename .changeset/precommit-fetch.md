---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/img': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/test': patch
'@data-client/vue': patch
'@data-client/use-enhanced-reducer': patch
---

Fix Suspense staying on the fallback when a fetch resolves before the store commits

A [useSuspense](/docs/api/useSuspense) or `use(useFetch())` read that finishes while [DataProvider](/docs/api/DataProvider) is still rendering now shows its result once the provider commits, instead of leaving the fallback up. The endpoint is not called again. A fetch that fails is included.

[useEnhancedReducer](https://www.npmjs.com/package/@data-client/use-enhanced-reducer) applies actions that arrive before the hook has committed, in order, from its mount effect. `dispatch` still returns a promise that resolves when that action commits.
