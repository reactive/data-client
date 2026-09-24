---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/img': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/test': patch
'@data-client/use-enhanced-reducer': patch
'@data-client/vue': patch
---

Fix Suspense staying on the fallback when a resolved read races the first commit

`useSuspense` of an endpoint that is already resolved now shows its value when React restarts `DataProvider` before that provider commits. The read still starts during render.

A `managers` array kept outside `DataProvider` can still leave that Suspense fallback up when the response was delivered to a provider React discarded. Let `DataProvider` build the managers, or create them with the provider that commits.
