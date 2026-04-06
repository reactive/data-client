---
'@data-client/normalizr': patch
---

Defer entity table POJO construction to avoid V8 field constness invalidations

During normalization, entity tables are no longer cloned-then-mutated. Instead, new entities accumulate in Maps during traversal and are merged into final POJOs in a single `finalize()` pass where each property is written exactly once. This eliminates the `getNewEntities` V8 deopt bailout and preserves field constness for downstream optimized code.
