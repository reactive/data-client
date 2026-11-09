---
'@data-client/codemods': patch
---

Move off deprecated APIs in the `v0.19` codemod

The codemod renames:

- `Resource.create` to [`Resource.getList.push`](https://dataclient.io/rest/api/resource#push) where the endpoint is run
  (called, or passed to `fetch()` or a hook), when the `resource()` is a `const` in the same file that nothing changes,
  and its `extend()` calls don't replace `create` or `getList`. Each read of `getList.push` makes a new endpoint, so other
  uses, such as `action.endpoint === PostResource.create`, get a `TODO(data-client)` comment instead.
- DevTools `actionsBlacklist` / `actionsWhitelist` to `actionsDenylist` / `actionsAllowlist`.

It adds a `TODO(data-client)` comment on the rest, whose replacement depends on the code: `*Resource.create` that it
can't rename, `waitForNextUpdate()`, `renderDataHook.cleanup()` / `.allSettled()`, and Vue `createDataClient()` /
`ProvidedDataClient`.

```ts
ctrl.fetch(PostResource.create, body);
// becomes
ctrl.fetch(PostResource.getList.push, body);
```
