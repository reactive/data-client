---
'@data-client/rest': patch
---

Fix `RestEndpoint.push`, `unshift` and `remove` body types when the endpoint's `schema` is a `Query` wrapping a `Collection`

Sorting or filtering a list with a [Query](https://dataclient.io/rest/api/Query) around its [Collection](https://dataclient.io/rest/api/Collection) made `getPosts.push` reject every body except `FormData`, though it adds to the list at runtime. The body is now typed from the Collection's Entity, so a correct body compiles and a wrong field is a TypeScript error.

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string },
  schema: new Query(
    new Collection([Post], { nonFilterArgumentKeys: /orderBy/ }),
    (posts, { orderBy } = {}) =>
      orderBy ?
        [...posts].sort((a, b) => a[orderBy].localeCompare(b[orderBy]))
      : posts,
  ),
});

ctrl.fetch(getPosts.push, { group: 'react' }, { title, author });
```

If you cast the body to get past this error, the cast can go:

```ts
// Before
ctrl.fetch(getPosts.push, { group: 'react' }, { title, author } as any);
// After
ctrl.fetch(getPosts.push, { group: 'react' }, { title, author });
```
