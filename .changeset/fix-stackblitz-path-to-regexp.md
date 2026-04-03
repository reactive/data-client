---
'@data-client/rest': patch
---

Fix compatibility with StackBlitz WebContainers

Consolidate `path-to-regexp` imports into a single module to avoid
CJS/ESM interop failures in StackBlitz's WebContainers environment,
where webpack could not resolve the `pathToRegexp` named export from
the CJS `path-to-regexp` package.

Also caches `pathToRegexp()` results, improving repeated `testKey()` performance.
