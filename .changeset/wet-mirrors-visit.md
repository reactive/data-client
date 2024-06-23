---
'@data-client/endpoint': patch
---

Validate after marking cirucular reference loops

This should not change any behavior as validate should be deterministic so if it fails
it will fail again and failure measure throwing which exits the whole stack.
This improves code grouping. (And possibly cache locality improvement - though didn't check.)