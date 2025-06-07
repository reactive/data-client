---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
---

delegate.getEntity(key) -> delegate.getEntities(this.key)

Return value is a restricted interface with keys() and entries() iterator methods.
This applies to both schema.queryKey and schema.normalize method delegates.

```ts
const entities = delegate.getEntities(key);

// foreach on keys
for (const key of entities.keys()) {}
// Object.keys() (convert to array)
return [...entities.keys()];
// foreach on full entry
for (const [key, entity] of entities.entries()) {}
```

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
const entities = delegate.getEntities(this.key);
if (entities)
  for (const collectionKey of entities.keys()) {
    if (!filterCollections(JSON.parse(collectionKey))) continue;
    delegate.mergeEntity(this, collectionKey, normalizedValue);
  }
```