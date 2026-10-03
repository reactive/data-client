---
'@data-client/vue': patch
---

Fix [useFetch()](https://dataclient.io/docs/api/useFetch) return type to be a `Ref`

`useFetch()` returns a `Ref` holding the fetch promise, but was typed as returning the promise directly.

```ts
const promise = useFetch(PostResource.get, { id });
// Before: promise.resolved typechecked, but was always undefined at runtime
// After:
if (promise.value && !promise.value.resolved) {
  // fetch is in-flight
}
```
