---
'@data-client/rest': patch
---

Warn in development when a mutation's [getRequestInit()](https://dataclient.io/rest/api/RestEndpoint#getRequestInit) returns no `method`

`getRequestInit()` is async. An override that spreads it without `await` drops `method`, `body` and
headers, so `fetch()` silently sends a GET. Now this logs an error in development.

```ts
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  async getRequestInit(body) {
    return {
      // without await, every mutation is sent as a GET
      ...(await super.getRequestInit(body)),
      credentials: 'include',
    };
  }
}
```
