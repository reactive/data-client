---
'@data-client/rest': minor
---

resource() accepts [nonFilterArgumentKeys](https://dataclient.io/rest/api/Collection#nonfilterargumentkeys)

```ts
const PostResource = resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: ['orderBy'],
});
```
