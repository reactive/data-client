---
'@data-client/normalizr': minor
---

MemoCache.query returns `{ data, paths }` just like denormalize. `data` could be INVALID

#### Before

```ts
return this.memo.query(schema, args, state);
```

#### After

```ts
const { data } = this.memo.query(schema, args, state);
return typeof data === 'symbol' ? undefined : (data as any);
```