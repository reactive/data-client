---
'@data-client/normalizr': patch
---

Fix deepClone to only copy own properties

`deepClone` in the immutable store path now uses `Object.keys()` instead of `for...in`, preventing inherited properties from being copied into cloned state.
