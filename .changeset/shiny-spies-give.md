---
'@data-client/rest': minor
'@rest-hooks/rest': minor
---

Add Resource.extend()

This is polymorphic, and has three forms

Set any field based on arguments:

```ts
Resource.extend('fieldName', { path: 'mypath/:id' });
```

Override any of the provided endpoints with options:

```ts
Resource.extend({
  getList: {
    path: 'mypath/:id',
  },
  update: {
    body: {} as Other,
  },
});
```

Function to compute derived endpoints:

```ts
Resource.extend((base) => ({
  getByComment: base.getList.extend({
    path: 'repos/:owner/:repo/issues/comments/:comment/reactions',
  }),
}));
```

Idea credits: @Dav3rs