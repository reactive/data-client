## Changesets (release notes)

Any user-facing change in a published package (`packages/*`) requires a changeset. Run `yarn changeset` from repo root. See skill "changeset" for format and full workflow.

## Bundle size

Report sizes as brotli (quality 11), the compression apps should ship. CI's bundle-size comment and `scripts/bundler-compare` measure brotli.

### `sideEffects`

Every package with a `sideEffects` array lists all its entry files, so webpack and rspack keep each package in one concatenated module (−672 to −796 B brotli in split apps). Turbopack keeps whatever a listed entry re-exports as a namespace or from another package. Moving that into a side-effect-free local file (react's `coreExports.ts`, `internalNamespace.ts`) saved react's index 844 B but made core's larger, so measure Turbopack before adding or wrapping one. Numbers, versions and how to re-measure: `examples/test-bundlesize/README.md`.

## Bundler-sensitive changes

For changes to `sideEffects`, entry fields, how entry files re-export, or module boundaries, measure with `scripts/bundler-compare` (rspack, Vite 8, Turbopack): bundlers can disagree there. Other size changes only need CI's bundle-size check.
