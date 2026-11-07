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

Measured on the packed packages, before → after:
- Copies of `Controller` loaded with `@data-client/core/mock` or `@data-client/react/mock`: 2 → 1. React contexts
  loaded with `@data-client/react/redux` or `/ssr` under `import`: 2 → 1.
- Code Node loads for the main entry plus a subpath under `import`: react `/redux` 355 → 160 KB, `/ssr` 377 → 155 KB,
  `/mock` 445 → 149 KB; core `/mock` 411 → 115 KB.
- CommonJS `dist/`: core 164 → 78 KB, react 120 → 63 KB (React Native build 92 → 58 KB). rest is unchanged.
- Browser bundles: unchanged (0 bytes).
