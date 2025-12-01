---
'@data-client/rest': patch
---

Fix `getPage` types when paginationField is in body

```ts
const ep = new RestEndpoint({
  path: '/rpc',
  method: 'POST',
  body: {} as { page?: number; method: string },
  paginationField: 'page',
});
// Before: ep.getPage({ page: 2 }, { method: 'get' }) ❌
// After:  ep.getPage({ page: 2, method: 'get' })     ✓
```
