---
'@data-client/normalizr': minor
---

Change MemoCache methods interface

```ts
class MemoCache {
  denormalize(schema, input, entities, args): { data, paths };
  query(schema, args, entities, indexes): data;
  buildQueryKey(schema, args, entities, indexes): normalized;
}
```