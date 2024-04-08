---
'@data-client/normalizr': minor
---

BREAKING CHANGE: buildQueryKey() -> memo.buildQueryKey()

```ts title="Before"
const results = buildQueryKey(schema, args, state.indexes, state.entities);
```

```ts title="After"
const memo = new MemoCached();
memo.buildQueryKey(key, schema, args, state.entities, state.indexes);
```
