# test-bundlesize

CI's "Bundle Size" check builds this app with webpack (`yarn build:sizecompare`) for the PR and its base, and
comments the gzip difference. The app puts `@data-client/*` in their own chunks, like real vendor-split apps.

## Why packages list their entry files in `sideEffects`

Validated 2026-11-01 (#4487) with webpack 5.112, rspack 2.3, Vite 7.3 (Rollup 4.67), Vite 8.3 (Rolldown 1.2) and
Next.js 16.4 (Turbopack and webpack). Bundlers change, so re-measure before reverting any of this.

- With `"sideEffects": false`, webpack and rspack skip a package's index and wire each import to the file that
  defines it. When the app and the package are in different chunks, every imported name becomes its own module
  concatenation root, and the modules they share stay separate behind export getters.
- Listing the index (and every other entry file) as side-effectful keeps the bundler at the index, so each package
  is concatenated into one module. `packages/core/src/__tests__/sideEffects.node.ts` checks that every entry is
  listed.
- Turbopack keeps whatever a side-effectful index re-exports as a namespace (`export * as`) or from another
  package. `@data-client/react`'s index cost +1004 B until it re-exported `__INTERNAL__` and core's values through
  side-effect-free local files (`internalNamespace.ts`, `coreExports.ts`): +44 B against leaving react out, while webpack saves 472 B.
  Wrapping `usePromisifiedDispatch` too saved 3 B, so it stays. The `/redux` and `/mock` entries re-export core
  directly and weren't measured. Doing the same in core's index cost Turbopack +870 B, so measure rather than
  apply it everywhere.

Total gzipped JS (gzip -9) for a two-page app with lazy routes, and the same app in Next.js, before and after,
leaving out the `Object.hasOwn` fallback in the entry files:

| Bundler                |  Before |   After | Diff |
| ---------------------- | ------: | ------: | ---: |
| webpack 5              |  90 507 |  89 520 | −987 |
| rspack 2               |  90 093 |  89 268 | −825 |
| Vite 7, Vite 8         |         |         |    0 |
| Next.js 16 (Turbopack) | 201 551 | 200 781 | −770 |
| Next.js 16 (webpack)   | 307 509 | 306 591 | −918 |

Vite (Rollup and Rolldown) already concatenates each chunk into one scope, so `sideEffects` doesn't change its
output. Single-chunk rspack builds change by under 50 B.

To re-measure, build a page-split app with each bundler against packed packages, toggle the `sideEffects` arrays
in the installed `package.json` files, and compare gzipped totals. Clear bundler caches between runs: webpack's
cache misses `package.json` edits.
