# @data-client/codemods

[![npm version](https://img.shields.io/npm/v/@data-client/codemods.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/codemods)

[jscodeshift](https://github.com/facebook/jscodeshift) codemods that migrate code to new
[Reactive Data Client](https://dataclient.io) releases. Commit first so you can review the diff, then run one
against your source folders:

```bash
npx @data-client/codemods v0.18 src/
```

| Codemod         | Migrates                                                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0.18`         | `Schema.denormalize()`/`normalize()` to the delegate signatures ([v0.18 post](https://dataclient.io/blog/2026/05/01/v0.18-scalar-typed-downloads))                                        |
| `v0.16`         | `path-to-regexp` v8 path syntax, `useFetch()` truthiness checks and `schema.X` imports ([v0.16 post](https://dataclient.io/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy)) |
| `v0.15`         | `useDebounce()` results, `entityMeta`, `MemoCache` state and `INVALID` imports ([v0.15 post](https://dataclient.io/blog/2026/01/06/v0.15-vue-support-collection-remove))                  |
| `axios-to-rest` | `axios` calls to `RestEndpoint` calls, with a `TODO(data-client)` comment on what's left ([axios migration guide](https://dataclient.io/rest/guides/axios-migration))                     |

It processes JavaScript and TypeScript files and skips `node_modules`. Other
[jscodeshift options](https://github.com/facebook/jscodeshift#usage-cli) pass through, such as `--dry` and `--print`
to preview changes, or `--extensions` to override the file types.
