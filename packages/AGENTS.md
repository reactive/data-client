## Bundle size

- Report sizes as brotli (quality 11), since apps should ship brotli. CI's bundle-size comment and `scripts/bundler-compare` both report it.
- For changes to `sideEffects`, entry fields, entry-file re-exports or module boundaries, measure with `scripts/bundler-compare` (rspack, Vite 8, Turbopack): bundlers disagree there. Other size changes need only CI's check.
- Each `sideEffects` array lists all of the package's entry files, so webpack and rspack concatenate each package into one module. `packages/core/src/__tests__/sideEffects.node.ts` enforces it.
- Turbopack keeps what a listed entry re-exports as a namespace or from another package. Routing that through a side-effect-free local file (react's `coreExports.ts`, `internalNamespace.ts`) saved react 844 B but made core larger, so measure Turbopack before adding or wrapping one. Numbers and how to re-measure: `examples/test-bundlesize/README.md`.
