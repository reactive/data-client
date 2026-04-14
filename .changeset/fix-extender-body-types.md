---
'@data-client/rest': patch
---

Fix [Collection](https://dataclient.io/rest/api/Collection) extender body types to match their HTTP method semantics

PATCH extenders (`.move`, `.remove`) now type their body as `Partial`, matching
[`partialUpdate`](https://dataclient.io/rest/api/resource#partialupdate). Previously they
required the full body type even though they are PATCH endpoints.

Standalone `RestEndpoint` without an explicit `body` option now derives a typed
body from the Collection's entity schema instead of falling back to `any`.

```ts
const MyResource = resource({
  path: '/articles/:id',
  schema: Article,
  body: {} as { title: string; content: string },
});

// move (PATCH) now accepts partial body
MyResource.getList.move({ id: '1' }, { title: 'new title' });

// push (POST) still requires full body
MyResource.getList.push({ title: 'hi', content: 'there' });
```

