---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add [Union](https://dataclient.io/rest/api/Union) support to [schema.Invalidate](https://dataclient.io/rest/api/Invalidate)
for polymorphic delete operations:

```ts
new schema.Invalidate(
  { users: User, groups: Group },
  'type'
)
```

or

```ts
new schema.Invalidate(MyUnionSchema)
```
