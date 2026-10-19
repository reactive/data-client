---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/test': patch
---

Fix fixture types needing `@data-client/endpoint` installed

`Fixture` and the other fixture types from `@data-client/react/mock`, `@data-client/core/mock` and `@data-client/test` no
longer resolve `@data-client/endpoint`, which those packages don't depend on. Projects that install only
`@data-client/react` and `@data-client/test` (for example with pnpm's strict layout) no longer get
`Cannot find module '@data-client/endpoint'` when type-checking fixtures.
