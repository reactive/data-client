---
'@data-client/codemods': patch
---

Migrate unawaited reads, `controller.resolve()` and `__DC_CONTROLLERS__` in the `v0.19` codemod

- Deletes a no-op `.catch(() => {})` on an unawaited `fetchIfStale()`, or on an unawaited `fetch()` of a resource's
  `get`, `getList` or `getList.getPage`. These reads never reject unhandled in 0.19. Catches on mutations, catches that
  do something, catches whose result is used (including an `async` event handler's), and catches on resources whose
  `extend()` replaces that endpoint, or that come from a package, stay.
- Passes the fetch action's `meta.fetchedAt` to `controller.resolve(action.endpoint, ...)` in place of `Date.now()`
  under an `actionTypes.FETCH` check, since 0.19 matches each response to its fetch by `fetchedAt`.
- Rewrites `__DC_CONTROLLERS__.get(name)` to read `__DC__.controller` after setting `__DC__.store = name`, and the
  store names to `__DC__.stores`. It does this in any file you pass it, since debugging scripts often don't import
  Data Client. It adds a `TODO(data-client)` comment on other uses, such as code that handles a missing store, since
  `__DC__.controller` throws where `.get(name)` returned `undefined`.

```ts
ctrl.fetch(TodoResource.getList).catch(() => {});
if (action.type === actionTypes.FETCH)
  controller.resolve(action.endpoint, {
    args,
    response,
    fetchedAt: Date.now(),
  });
__DC_CONTROLLERS__.get('Data Client: My App').getState();
// becomes
ctrl.fetch(TodoResource.getList);
if (action.type === actionTypes.FETCH)
  controller.resolve(action.endpoint, {
    args,
    response,
    fetchedAt: action.meta.fetchedAt,
  });
__DC__.store = 'Data Client: My App';
__DC__.controller.getState();
```
