---
'@data-client/core': patch
'@data-client/react': patch
'@rest-hooks/core': patch
'@rest-hooks/react': patch
---

[Collections](https://dataclient.io/rest/api/Collection) can filter based on FormData arguments

```ts
ctrl.fetch(
  getPosts.push,
  { group: 'react' },
  new FormData(e.currentTarget),
);
```

Say our FormData contained an `author` field. Now that newly created
item will be properly added to the [collection list](https://dataclient.io/rest/api/Collection) for that author.

```ts
useSuspense(getPosts, {
  group: 'react',
  author: 'bob',
});
```

In this case if `FormData.get('author') === 'bob'`, it will show
up in that [useSuspense()](https://dataclient.io/docs/api/useSuspense) call.

See more in the [Collection nonFilterArgumentKeys example](https://dataclient.io/rest/api/Collection#nonfilterargumentkeys)