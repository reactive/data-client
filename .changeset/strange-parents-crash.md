---
'@data-client/rest': minor
'@rest-hooks/rest': minor
---

Add 'paginationField' parameter to [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint#paginationfield) and [createResource](https://dataclient.io/rest/api/createResource#paginationfield)

This adds a '[getPage](https://dataclient.io/rest/api/RestEndpoint#getPage)' member; similar to getList.push/unshift but for [pagination](https://dataclient.io/rest/guides/pagination).

```ts
const TodoResource = createResource({
  path: '/todos/:id',
  schema: Todo,
  paginationField: 'page',
}).getList.getPage({ page: '2' });
```