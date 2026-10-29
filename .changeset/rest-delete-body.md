---
'@data-client/rest': patch
---

Send the body of a `DELETE` endpoint that declares `body`

A `DELETE` endpoint with a `body` used to drop it: the request went out with no body, and the last argument was read as the url params. It now sends the body, as its types already said.

```ts
const deleteMany = new RestEndpoint({
  path: '/posts',
  method: 'DELETE',
  body: [] as string[],
});
// Before: DELETE /posts?0=5&1=13 with no body
// After: DELETE /posts with body ["5","13"]
deleteMany(['5', '13']);
```

`DELETE` endpoints without `body`, like `resource().delete`, send no body as before.
