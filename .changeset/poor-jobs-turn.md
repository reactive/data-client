---
'@data-client/normalizr': minor
---

new MemoCache().query() and new MemoCache().buildQueryKey() take state as one argument.

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
this.memo.query(schema, args, state.entities);
```

#### After

```ts
this.memo.query(schema, args, state);
```