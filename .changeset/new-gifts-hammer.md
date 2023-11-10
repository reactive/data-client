---
'@data-client/endpoint': patch
'@data-client/rest': patch
---

Query works with any Schema - including Collections

```ts
export const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  (entries) => entries && entries.filter((todo) => !todo.completed).length,
);
```

NOTE: Query.schema internals are laid out differently