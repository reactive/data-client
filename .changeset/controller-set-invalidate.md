---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` types for a single [Invalidate](https://dataclient.io/rest/api/Invalidate)

Deleting one entity with `set()` worked at runtime but failed to typecheck, since `Invalidate` isn't
[Queryable](https://dataclient.io/rest/api/schema#queryable). Pass the schema and the row to delete; the row is typed
by the Entity's fields.

```ts
// Before: TypeScript error
// After: no error
ctrl.set(new Invalidate(Post), { id: '5' });
```

It takes no `args` and no updater function.
