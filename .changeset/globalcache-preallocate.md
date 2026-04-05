---
'@data-client/normalizr': patch
---

Improve denormalization performance by pre-allocating the dependency tracking slot

Replace `Array.prototype.unshift()` in `GlobalCache.getResults()` with a pre-allocated slot at index 0, avoiding O(n) element shifting on every cache-miss denormalization.
