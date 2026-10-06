---
'@data-client/rest': patch
---

Fix `RestEndpoint.push`, `unshift` and `remove` body types when a `Query` or `Lazy` wraps the endpoint's `Collection`

Sorting or filtering a list with a [Query](https://dataclient.io/rest/api/Query) around its [Collection](https://dataclient.io/rest/api/Collection) made `getPosts.push` reject every body except `FormData`, though it adds to the list at runtime. The body is now typed from the Collection's Entity, so a correct body compiles and a wrong field is a TypeScript error. The same applies to a Collection wrapped in [Lazy](https://dataclient.io/rest/api/Lazy).

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string },
  schema: new Query(
    new Collection([Post], { nonFilterArgumentKeys: /orderBy/ }),
    (posts, { orderBy } = {}) => sortBy(posts, orderBy),
  ),
});
```

If you cast the body to get past this error, the cast can go:

```ts
// Before
ctrl.fetch(getPosts.push, { group: 'react' }, { title, author } as any);
// After
ctrl.fetch(getPosts.push, { group: 'react' }, { title, author });
```
