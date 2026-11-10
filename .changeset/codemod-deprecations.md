---
'@data-client/codemods': patch
---

Move off deprecated APIs in the `v0.19` codemod

The codemod renames:

- `Resource.create` to [`Resource.getList.push`](https://dataclient.io/rest/api/resource#push) where the endpoint runs,
  for a `resource()` declared in the same file. Each read of `getList.push` makes a new endpoint, so other uses, such as
  `===` comparisons, get a `TODO(data-client)` comment instead.
- DevTools `actionsBlacklist` / `actionsWhitelist` to `actionsDenylist` / `actionsAllowlist`.

It adds a `TODO(data-client)` comment on the rest, whose replacement depends on the code: `*Resource.create` that it
can't rename, `waitForNextUpdate()`, `renderDataHook.cleanup()` / `.allSettled()`, and Vue `createDataClient()` /
`ProvidedDataClient`.

Pass `--deprecations=false` to skip these, or `--deprecations=only` to run just these, for example as a separate
commit after the 0.19 upgrade.

```ts
ctrl.fetch(PostResource.create, body);
// becomes
ctrl.fetch(PostResource.getList.push, body);
```
