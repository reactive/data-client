---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
---

delegate.getEntity(key) -> delegate.forEntities(key, cb)

This applies to both schema.queryKey and schema.normalize method delegates.

#### Before

```ts
const entities = delegate.getEntity(this.key);
if (entities)
  Object.keys(entities).forEach(collectionPk => {
    if (!filterCollections(JSON.parse(collectionPk))) return;
    delegate.mergeEntity(this, collectionPk, normalizedValue);
  });
```

#### After

```ts
delegate.forEntities(this.key, ([collectionKey]) => {
  if (!filterCollections(JSON.parse(collectionKey))) return;
  delegate.mergeEntity(this, collectionKey, normalizedValue);
});
```