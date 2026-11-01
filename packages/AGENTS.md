## Changesets (release notes)

Any user-facing change in a published package (`packages/*`) requires a changeset. Run `yarn changeset` from repo root. See skill "changeset" for format and full workflow.

## Bundle size: `sideEffects`

Every package with a `sideEffects` array lists all its entry files, so webpack and rspack keep each package in one concatenated module (−770 to −987 B gzip in split apps). Keep a listed entry from re-exporting another package or a namespace directly: Turbopack keeps those (react's index cost +1004 B before `coreExports.ts` and `internalNamespace.ts`). Numbers, versions and how to re-measure: `examples/test-bundlesize/README.md`.
