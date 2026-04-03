---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Fix `maxEntityDepth` missing from Entity types on TypeScript 4.0

`maxEntityDepth` was not included in the TS 4.0 legacy type definitions,
so TypeScript 4.0 users could not set or reference this property on Entity classes.
