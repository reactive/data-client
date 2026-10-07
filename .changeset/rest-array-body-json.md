---
'@data-client/rest': patch
---

Fix pushing several items at once sending `"[object Object]"` instead of JSON

[RestEndpoint.push](https://dataclient.io/rest/api/RestEndpoint#push) and `unshift` accept an array of items, but sent
it to `fetch()` as-is, so the server received `"[object Object],[object Object]"` with no JSON `Content-Type`. Arrays are
now JSON-encoded like objects, with `Content-Type: application/json`. `FormData`, `Blob`, `URLSearchParams` and strings
still go to `fetch()` unchanged.

`resource().create` takes the same bodies as `getList.push`, including an array.

```ts
// Before: the server received "[object Object],[object Object]"
// After: the server receives [{"title":"Buy milk"},{"title":"Walk dog"}]
await ctrl.fetch(TodoResource.getList.push, [
  { title: 'Buy milk' },
  { title: 'Walk dog' },
]);
```
