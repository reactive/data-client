# @data-client/codemods

[![npm version](https://img.shields.io/npm/v/@data-client/codemods.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/codemods)

[jscodeshift](https://github.com/facebook/jscodeshift) codemods that migrate code to new
[Reactive Data Client](https://dataclient.io) releases. Commit first so you can review the diff, then run one
against your source folders:

```bash
npx @data-client/codemods v0.19 src/
```

| Codemod         | Migrates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0.19`         | `managers` arrays to functions that return them, `getMiddleware()` to `middleware`, `renderDataHook()`'s default Managers, [`fetchIfStale()`](https://dataclient.io/docs/api/Controller#fetchIfStale) Promise checks, mocks and missing-result handling, no-op catches on unawaited reads, [`controller.resolve()`](https://dataclient.io/docs/api/Controller#resolve)'s `fetchedAt`, `__DC_CONTROLLERS__` to `__DC__`, and deprecated APIs such as `resource().create` to `getList.push`, with a `TODO(data-client)` comment on what's left ([v0.19 post](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#migration-guide)) |
| `v0.18`         | `Schema.denormalize()`/`normalize()` to the delegate signatures ([v0.18 post](https://dataclient.io/blog/2026/05/01/v0.18-scalar-typed-downloads))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `v0.16`         | `path-to-regexp` v8 path syntax, `useFetch()` truthiness checks and `schema.X` imports ([v0.16 post](https://dataclient.io/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy))                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `v0.15`         | `useDebounce()` results, `entityMeta`, `MemoCache` state and `INVALID` imports ([v0.15 post](https://dataclient.io/blog/2026/01/06/v0.15-vue-support-collection-remove))                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `axios-to-rest` | `axios` calls to `RestEndpoint` calls, with a `TODO(data-client)` comment on what's left ([axios migration guide](https://dataclient.io/rest/guides/axios-migration))                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

For `v0.19`, `--deprecations=false` skips deprecated APIs and `--deprecations=only` does just those, so they can go in
their own commit. `--improvements=only` makes optional rewrites that adopt 0.19 features once you've upgraded, where the
store ends up the same for valid rows, unless a file the codemod didn't read patches the Entity: loops that call
`ctrl.set()` once per row become one [batch `set()`](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#batch-set),
and code that worked around older limits, like `computed()` around Vue composable args, is simplified. A batch runs only
`if (rows.length)` (unless its list is an array literal) and dispatches one SET action whose `action.schema` is
`[Entity]` instead of one per row, so Managers that match `action.schema` should check `action.schema[0]`, and a row
whose `pk()` or `process()` throws makes the whole batch write nothing, where the loop still wrote some of the other
rows. Rows with the same `pk` in one batch merge with each other, so only the first is checked against the stored
entity's `fetchedAt`; this differs only when the store holds newer data than the client's clock, such as after SSR from
a server whose clock runs ahead. It processes JavaScript and TypeScript files and skips `node_modules`. Other
[jscodeshift options](https://github.com/facebook/jscodeshift#usage-cli) pass through, such as `--dry` and `--print` to
preview changes, or `--extensions` to override the file types.
