# test-bundlesize

CI's "Bundle Size" check builds this app with webpack (`yarn build:sizecompare`) for the PR and its base, and
comments the brotli difference. The app puts `@data-client/*` in their own chunks, like real vendor-split apps.

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
  package. `@data-client/react`'s index cost +871 B until it re-exported `__INTERNAL__` and core's values through
  side-effect-free local files (`internalNamespace.ts`, `coreExports.ts`): +27 B against leaving react out, while
  rspack saves 303 B. Wrapping `usePromisifiedDispatch` too saved a few bytes, so it stays. The `/redux` and `/mock`
  entries re-export core directly and weren't measured. Doing the same in core's index made Turbopack's output
  larger, so measure rather than apply it everywhere.

Total brotli JS (quality 11) for a two-page app with lazy routes (`scripts/bundler-compare`), at #4487 with and
without its `sideEffects` and react index changes, leaving out the `Object.hasOwn` fallback in the entry files.
Re-measured 2026-11-09 with rspack 2.3, Vite 8.3 and Next.js 16.4:

| Bundler                |  Before |   After | Diff |
| ---------------------- | ------: | ------: | ---: |
| rspack 2               |  77 608 |  76 812 | −796 |
| Vite 8                 |  76 674 |  76 674 |    0 |
| Next.js 16 (Turbopack) | 174 688 | 174 016 | −672 |

On 2026-11-01, webpack 5 and Next.js 16 with webpack saved about as much as rspack. Vite (Rollup and Rolldown)
already concatenates each chunk into one scope, so `sideEffects` doesn't change its output. Single-chunk rspack
builds change by under 50 B.

To re-measure, run `scripts/bundler-compare/measure.sh` on a branch that changes the `sideEffects` arrays and on
its base, then `--compare` the two runs. It covers rspack, Vite 8 and Turbopack. For webpack, build this app with
the webpack cache off: it misses `package.json` edits.
