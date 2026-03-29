---
'@data-client/normalizr': patch
'@data-client/endpoint': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix stack overflow during denormalization of large bidirectional entity graphs.

Add entity depth limit (64) to prevent `RangeError: Maximum call stack size exceeded`
when denormalizing cross-type chains with thousands of unique entities
(e.g., Department → Building → Department → ...). Entities beyond the depth limit
are returned with unresolved ids instead of fully denormalized nested objects.

The limit can be configured per-Entity with [`static maxEntityDepth`](/rest/api/Entity#maxEntityDepth):

```ts
class Department extends Entity {
  static maxEntityDepth = 16;
}
```
