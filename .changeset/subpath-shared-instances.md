---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/rest': patch
---

Share one copy of the library between the main entry and its subpaths in Node

In Node (and tools that run on it, like Vitest and Jest), `@data-client/react/redux`, `/ssr`, `/mock` and `/next`,
and `@data-client/core/mock` could load a second copy of the code the main entry already loaded. Hooks then ignored the providers from those subpaths: a hook inside `@data-client/react/redux`'s
provider got a different controller than the provider's, and `@data-client/core/mock` ran on its own `Controller`.
Each subpath now shares the main entry's code under both `import` and `require()`.

