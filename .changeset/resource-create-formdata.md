---
'@data-client/rest': patch
---

Fix TypeScript error passing `FormData` to `resource().create`

`resource().create` sends a `FormData` body as-is, the same as `update`, `partialUpdate` and
`getList.push`, but its type only allowed an object, so submitting a form needed a cast. This now typechecks,
and you can drop the cast. `create` is deprecated, and its replacement `getList.push` takes `FormData` too.

```tsx
<form
  onSubmit={e => {
    e.preventDefault();
    // Before: TypeScript error, so you had to cast
    ctrl.fetch(PostResource.create, new FormData(e.currentTarget) as any);
    // After
    ctrl.fetch(PostResource.create, new FormData(e.currentTarget));
  }}
>
```
