---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` accepting any value

Values are now typed by the schema: Entities take their fields, while [Collection](https://dataclient.io/rest/api/Collection)
and [All](https://dataclient.io/rest/api/All) take a list of rows. [Query](https://dataclient.io/rest/api/Query) takes
the input of the schema it wraps, not what its `process()` returns. Updater functions must return the same.

```ts
// Before: these all typechecked, then failed or wrote nothing at runtime
ctrl.set(new schema.All(Todo), 42);
ctrl.set(TodoResource.getList.schema, 'anything');
ctrl.set(Todo, { id: '5' }, { id: '5', completed: 'yes' });

// After: TypeScript errors on the above; these typecheck
ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
ctrl.set(new schema.All(Todo), [{ id: '5', completed: true }]);
```

A [Union](https://dataclient.io/rest/api/Union) row is checked against the member its discriminator selects. Only
declared fields are accepted, so a key read by a `schemaAttribute` function must be declared on each member.

```ts
const Feed = new schema.Union({ post: Post, comment: Comment }, 'type');
// TypeScript error: commentBody is a Comment field, not a Post field
ctrl.set(Feed, { id: '1', type: 'post' }, { type: 'post', commentBody: 'hi' });
```
