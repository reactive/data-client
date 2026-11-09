# test-bundlesize

CI's "Bundle Size" check builds this app with webpack (`yarn build:sizecompare`) for the PR and its base, and
comments the brotli difference. The app puts `@data-client/*` in their own chunks, like real vendor-split apps.

## Why packages list their entry files in `sideEffects`

Found in [#4487](https://github.com/reactive/data-client/pull/4487) (2026-11-01) with webpack 5, rspack 2, Vite 7
(Rollup), Vite 8 (Rolldown) and Next.js 16 (Turbopack and webpack). The numbers below were re-measured in brotli on
2026-11-09. Bundlers change, so re-measure before reverting any of this.

- With `"sideEffects": false`, webpack and rspack skip a package's index and wire each import to the file that
  defines it. When the app and the package are in different chunks, every imported name becomes its own module
  concatenation root, and the modules they share stay separate behind export getters.
- Listing the index (and every other entry file) as side-effectful keeps the bundler at the index, so each package
  is concatenated into one module. `packages/core/src/__tests__/sideEffects.node.ts` checks that every entry is
  listed.
- Turbopack keeps whatever a side-effectful index re-exports as a namespace (`export * as`) or from another
  package. Against leaving `@data-client/react` out of `sideEffects`, listing its index cost Turbopack +871 B while
  the index re-exported `__INTERNAL__` and core's values directly. Re-exporting them through side-effect-free local
  files (`internalNamespace.ts`, `coreExports.ts`) cut that to +27 B (844 B less), while rspack saves 303 B. Wrapping `usePromisifiedDispatch` too saved a few bytes, so it stays. The `/redux` and `/mock`
  entries re-export core directly and weren't measured. Doing the same in core's index made Turbopack's output
  larger, so measure rather than apply it everywhere.

Total brotli JS (quality 11) for a two-page app with lazy routes (`scripts/bundler-compare`), at
[#4487](https://github.com/reactive/data-client/pull/4487) with and without its `sideEffects` and react index changes,
leaving out the `Object.hasOwn` fallback in the entry files. Measured 2026-11-09 with webpack 5.112, rspack 2.3, Vite
8.3 and Next.js 16.4. The webpack rows were measured once, building the same app with webpack's defaults and
`swc-loader`; they confirm rspack tracks webpack, so reports use rspack.

| Bundler                |  Before |   After | Diff |
| ---------------------- | ------: | ------: | ---: |
| webpack 5              |  79 166 |  78 311 | −855 |
| rspack 2               |  77 608 |  76 812 | −796 |
| Vite 8                 |  76 674 |  76 674 |    0 |
| Next.js 16 (Turbopack) | 174 688 | 174 016 | −672 |
| Next.js 16 (webpack)   | 261 188 | 260 328 | −860 |

Vite 8 (Rolldown) already concatenates each chunk into one scope, so `sideEffects` doesn't change its output; Vite 7
(Rollup) didn't change in #4487 either. Single-chunk rspack builds change by under 50 B.

To re-measure, run `scripts/bundler-compare/measure.sh` on a branch that changes the `sideEffects` arrays and on
its base, then `--compare` the two runs. It covers rspack (standing in for webpack), Vite 8 and Turbopack. To build
this app with webpack instead, turn its cache off: it misses `package.json` edits.
