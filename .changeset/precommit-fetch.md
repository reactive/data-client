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
---

Fix Suspense staying on the fallback when a fetch resolves before DataProvider mounts

[useSuspense](/docs/api/useSuspense) and `use(useFetch())` could stay on the fallback, or refetch in a loop, when their fetch finished before [DataProvider](/docs/api/DataProvider) had mounted. This happens when something outside the provider suspends during the first render, or when the provider sits inside a lazy-loaded layout, as with Expo Router. The result now shows once the provider mounts, the endpoint is not called again, and failed fetches are included.
