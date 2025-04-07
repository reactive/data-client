---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/core': minor
'@data-client/graphql': minor
'@data-client/react': minor
'@data-client/rest': minor
---

BREAKING CHANGE: schema.queryKey(args, queryKey, getEntity, getIndex) -> schema.queryKey(args, unvisit, delegate)
BREAKING CHANGE: delegate.getIndex() returns the index directly, rather than object.

We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

Our recursive call is renamed from queryKey to unvisit, and does not require the last two arguments.

```ts
/** Accessors to the currently processing state while building query */
export interface IQueryDelegate {
  getEntity: GetEntity;
  getIndex: GetIndex;
}
```

#### Before

```ts
queryKey(args, queryKey, getEntity, getIndex) {
  getIndex(schema.key, indexName, value)[value];
  getEntity(this.key, id);
  return queryKey(this.schema, args, getEntity, getIndex);
}
```

#### After

```ts
queryKey(args, unvisit, delegate) {
  delegate.getIndex(schema.key, indexName, value);
  delegate.getEntity(this.key, id);
  return unvisit(this.schema, args);
}
```
