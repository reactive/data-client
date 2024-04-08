---
'@data-client/normalizr': minor
---

BREAKING CHANGE: denormalizeCached() -> new MemoCache().denormalize()

```ts title="Before"
const endpointCache = new WeakEntityMap();
const entityCache = {};
denormalizeCached(input, schema, state.entities, entityCache, endpointCache, args);
```

```ts title="After"
const memo = new MemoCached();
memo.denormalize(input, schema, state.entities, args);
```
