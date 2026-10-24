---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix a cached parent showing a stale nested entity after it becomes valid

When a nested entity was `INVALID` (for example, it failed validation) or `null` in the store, the parent it belongs to kept returning the old result even after that entity was valid again. Parents now update as soon as the nested entity does.
