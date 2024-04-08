---
"@data-client/normalizr": minor
---

Add MemoCache

`MemoCache` is a singleton to store the memoization cache for denormalization methods

```ts
const memo = new MemoCache();
const data = memo.query(key, schema, args, state.entities, state.indexes);
const { data, paths } = memo.denormalize(input, schema, state.entities, args);
const queryKey = memo.buildQueryKey(
  key,
  schema,
  args,
  state.entities,
  state.indexes,
);
```