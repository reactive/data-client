---
'@data-client/normalizr': minor
---

BREAKING CHANGE: MemoCache.query() and MemoCache.buildQueryKey() take state as one argument

#### Before

```ts
this.memo.buildQueryKey(
  schema,
  args,
  state.entities,
  state.indexes,
  key,
);
```


#### After

```ts
this.memo.buildQueryKey(
  schema,
  args,
  state,
  key,
);
```

#### Before

```ts
this.memo.query(schema, args, state.entities, state.indexes);
```

#### After

```ts
this.memo.query(schema, args, state);
```