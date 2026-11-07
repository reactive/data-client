---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/rest': patch
---

Hooks see the providers from `@data-client/react/redux` and `/ssr` in Node

This affects tests and servers that run data-client in Node without a bundler (Vitest, Jest, Node SSR) and import a
subpath as well as the main entry. Browser bundles don't change.

- `@data-client/react/redux` and `@data-client/react/ssr`: hooks inside their providers now use that provider's
  store. Before, under Node `import` (as Vitest runs dependencies), those hooks acted as if no provider was rendered:
  they logged "It appears you are trying to use Reactive Data Client without a provider", read empty state, and
  their fetches went nowhere.
- `@data-client/core/mock` and `@data-client/react/mock`: `MockController` and fixtures now run on your app's
  `Controller` instead of a second copy.
- Less code to load: the main entry plus a subpath loads 55-72% less data-client code under Node `import` (react
  `/redux` 355 → 160 KB, core `/mock` 411 → 115 KB), and 20-25% less for `/mock` under `require()` (Jest), so test
  files that use them start faster. core's and react's CommonJS
  builds are about half the size (core 164 → 78 KB, react 120 → 63 KB).

You don't need to change any code. If you worked around this by inlining data-client in Vitest's
`server.deps.inline`, you can remove that.
