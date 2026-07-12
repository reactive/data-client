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

Fix TypeScript 7 module resolution for package exports

TypeScript 7 requires a `types` condition in `package.json` `exports`. Without it, imports resolved to runtime entrypoints like `node.mjs` and lost declaration files.
