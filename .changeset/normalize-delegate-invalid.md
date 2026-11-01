---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Add `delegate.INVALID` to the [normalize delegate](https://dataclient.io/rest/api/SchemaSimple#inormalizedelegate)

Custom schemas can now tell whether a stored entity was deleted (with [Invalidate](https://dataclient.io/rest/api/Invalidate))
by comparing what `getEntity()` returns to `delegate.INVALID`, as `queryKey()` already could.

```ts
normalize(input, parent, key, delegate) {
  if (delegate.getEntity(this.key, pk) === delegate.INVALID) {
    // this pk was deleted
  }
}
```
