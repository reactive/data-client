---
'@data-client/codemods': patch
---

Migrate unawaited reads, `controller.resolve()` and `__DC_CONTROLLERS__` in the `v0.19` codemod

- Deletes a no-op `.catch(() => {})` on an unawaited `fetchIfStale()`, or on an unawaited `fetch()` of a resource's
  `get`, `getList` or `getList.getPage`. These reads never reject unhandled in 0.19. Catches on mutations, catches that
  do something, and catches whose result is used stay.
- Passes the fetch action's `meta.fetchedAt` to `controller.resolve(action.endpoint, ...)` in place of `Date.now()`,
  since 0.19 matches each response to its fetch by `fetchedAt`.
- Rewrites `__DC_CONTROLLERS__.get(name)` to read `__DC__.controller` after setting `__DC__.store = name`, and reads of
  the first controller to `__DC__.controller`. It does this in any file you pass it, since debugging scripts often
  don't import Data Client, and adds a `TODO(data-client)` comment on other uses.

```ts
ctrl.fetch(TodoResource.getList).catch(() => {});
controller.resolve(action.endpoint, { args, response, fetchedAt: Date.now() });
__DC_CONTROLLERS__.get('Data Client: My App').getState();
// becomes
ctrl.fetch(TodoResource.getList);
controller.resolve(action.endpoint, {
  args,
  response,
  fetchedAt: action.meta.fetchedAt,
});
__DC__.store = 'Data Client: My App';
__DC__.controller.getState();
```
