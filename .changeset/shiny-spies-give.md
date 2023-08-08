---
'@data-client/rest': minor
'@rest-hooks/rest': minor
---

Add Resource.extend()

This is polymorphic, and has three forms

Set any field based on arguments:
Resource.extend('fieldName', { path: 'mypath/:id' });

Override any of the provided endpoints with options:
Resource.extend({
  getList: {
    path: 'mypath/:id',
  },
  update: {
    body: {} as Other,
  },
});

Function to compute derived endpoints:
Resource.extend((base) => ({
  getByComment: base.getList.extend({
    path: 'repos/:owner/:repo/issues/comments/:comment/reactions',
  }),
}));