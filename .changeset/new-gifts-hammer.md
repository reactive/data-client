---
'@data-client/endpoint': minor
'@data-client/rest': minor
---

Query works with any Schema - including Collections

```ts
export const queryRemainingTodos = new Query(
  TodoResource.getList.schema,
  (entries) => entries && entries.filter((todo) => !todo.completed).length,
);
```

BREAKING CHANGE: Query.schema internals are laid out differently