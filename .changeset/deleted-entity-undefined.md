---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `useCache()` and `useDLE()` returning a truthy `Symbol` for deleted entities

After an entity was deleted and its refetch failed, `useCache()` and `useDLE()` (React and Vue) returned an internal
`Symbol` instead of `undefined`. Since a `Symbol` is truthy, "not loaded" checks passed, and code went on to use it as
the entity:

```tsx
const todo = useCache(TodoResource.get, { id });
if (!todo) return <TodoPlaceholder />;
// Before: reached here with a Symbol; todo.title was undefined and todo.title.trim() threw
// After: the placeholder renders
return <TodoItem title={todo.title.trim()} />;
```

[Controller.getResponse()](https://dataclient.io/docs/api/Controller#getResponse) and
[Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) now also give `undefined` there,
like [Controller.get()](https://dataclient.io/docs/api/Controller#get) already did.
