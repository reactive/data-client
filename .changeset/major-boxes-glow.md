---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add delegate.INVALID to queryKey

This is used in schema.All.queryKey().

#### Before

```ts
queryKey(args: any, unvisit: any, delegate: IQueryDelegate): any {
  if (!found) return INVALID;
}
```

#### After

```ts
queryKey(args: any, unvisit: any, delegate: IQueryDelegate): any {
  if (!found) return delegate.INVALID;
}
```
