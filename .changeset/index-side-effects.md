---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/rest': patch
---

Shrink bundles when apps split chunks with webpack, rspack or Turbopack

Apps that split their bundle by page or vendor with webpack, rspack or Turbopack (Next.js) now get 770–987 B (gzip)
less Data Client code. Vite and single-bundle apps stay about the same size. Code you don't use, like
[Lazy](https://dataclient.io/rest/api/Lazy), is still left out.
