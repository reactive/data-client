---
'@data-client/core': patch
'@data-client/normalizr': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Endpoints that resolve to falsy values (`''`, `0`, `false`, or `null`) no longer trigger infinite refetches.
