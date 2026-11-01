---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/rest': patch
---

Smaller bundles with webpack when Data Client is in its own chunk

Apps that split vendor code into separate chunks (webpack `splitChunks`, as Next.js does) now get smaller Data Client
bundles: about 1.5 kB less gzipped across our bundle-size test app. Each package's entry files are now listed in
`sideEffects`, so webpack keeps them and can hoist each package into one module. Every other file is still
side-effect free, so code you don't use, like [Lazy](https://dataclient.io/rest/api/Lazy), is still left out.
