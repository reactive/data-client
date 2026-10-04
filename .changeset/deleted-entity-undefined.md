---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix deleted entities returning an internal `Symbol` instead of `undefined`

[Controller.getResponse()](https://dataclient.io/docs/api/Controller#getResponse) and
[Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) returned an internal `Symbol` as
`data` for a deleted entity, unlike [Controller.get()](https://dataclient.io/docs/api/Controller#get). It reached
`useCache()` and `useDLE()` (React and Vue) after a deleted entity's refetch failed, and Vue `useSuspense()` while
the refetch was in flight.

```ts
const todo = useCache(TodoResource.get, { id: 5 });
// after TodoResource.delete({ id: 5 }) and a failed refetch
// Before: todo was Symbol(INVALID)
// After: todo is undefined
```
