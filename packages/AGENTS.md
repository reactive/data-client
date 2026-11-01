## Changesets (release notes)

Any user-facing change in a published package (`packages/*`) requires a changeset. Run `yarn changeset` from repo root. See skill "changeset" for format and full workflow.

## Bundle size: `sideEffects`

Every package with a `sideEffects` array lists all its entry files, so webpack and rspack keep each package in one concatenated module (−770 to −987 B gzip in split apps). Turbopack keeps whatever a listed entry re-exports as a namespace or from another package. Moving that into a side-effect-free local file (react's `coreExports.ts`, `internalNamespace.ts`) saved react's index 1004 B but cost core's 870 B, so measure Turbopack before adding or wrapping one. Numbers, versions and how to re-measure: `examples/test-bundlesize/README.md`.
