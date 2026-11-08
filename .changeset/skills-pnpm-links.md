---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/react': patch
'@data-client/rest': patch
'@data-client/vue': patch
---

Fix `data-client-skills` links under pnpm breaking when Data Client upgrades

Links to the skills from `@data-client/core` and `@data-client/endpoint` now lead through the package you depend on, like `node_modules/@data-client/react/../core`, so they keep working after an upgrade. Run it again to update links an earlier version made.
