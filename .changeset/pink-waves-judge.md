---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Add Collection.remove

```ts
ctrl.set(MyResource.getList.schema.remove, { id });
```

```ts
const removeItem = MyResource.delete.extend({
  schema: MyResource.getList.schema.remove
})
```