---
'@data-client/codemods': patch
---

Move off deprecated APIs in the `v0.19` codemod

Where the replacement does the same thing, the codemod renames:

- `Resource.create` to [`Resource.getList.push`](https://dataclient.io/rest/api/resource#push), when the `resource()` is
  declared in the same file and its `extend()` calls don't replace `create` or `getList`.
- DevTools `actionsBlacklist` / `actionsWhitelist` to `actionsDenylist` / `actionsAllowlist`.

It adds a `TODO(data-client)` comment on the rest, whose replacement depends on the code: `*Resource.create` that it can't rename
(declared in another file, or its `extend()` replaces `create` or `getList`), `waitForNextUpdate()`, `renderDataHook.cleanup()` / `.allSettled()`, and Vue `createDataClient()` /
`ProvidedDataClient`.

```ts
ctrl.fetch(PostResource.create, body);
// becomes
ctrl.fetch(PostResource.getList.push, body);
```
