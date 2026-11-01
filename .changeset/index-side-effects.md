---
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/rest': patch
---

Smaller bundles with webpack and rspack when Data Client is in its own chunk

Apps that split vendor code into separate chunks with webpack or rspack (`splitChunks`) now get 440–710 B (gzip)
less Data Client code. Code you don't use, like [Lazy](https://dataclient.io/rest/api/Lazy), is still left out.

The `Object.hasOwn` fallback in the package entry files now runs in bundled apps too. Before, webpack, rspack and
Vite 8 dropped it, so browsers without `Object.hasOwn` (before Chrome 93 or Safari 15.4) threw
`Object.hasOwn is not a function` unless the app loaded its own polyfill.
