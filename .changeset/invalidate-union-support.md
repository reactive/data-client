---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add [Union](https://dataclient.io/rest/api/Union) support to [schema.Invalidate](https://dataclient.io/rest/api/Invalidate)
and [resource().delete](https://dataclient.io/rest/api/resource#delete) for polymorphic delete operations.

[resource()](https://dataclient.io/rest/api/resource) with Union schema now automatically
wraps the delete endpoint schema in Invalidate:

```ts
const FeedResource = resource({
  path: '/feed/:id',
  schema: FeedUnion, // Union of Post, Comment, etc.
});
// FeedResource.delete automatically uses Invalidate(FeedUnion)
await ctrl.fetch(FeedResource.delete, { id: '123' });
```

For standalone endpoints, use `schema.Invalidate` directly:

```ts
new schema.Invalidate(MyUnionSchema)
```
