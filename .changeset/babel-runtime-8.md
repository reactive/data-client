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

Support `@babel/runtime` 8

Apps on Babel 8 now share their `@babel/runtime` with Data Client instead of installing a second copy. Apps on Babel 7 keep working unchanged.
