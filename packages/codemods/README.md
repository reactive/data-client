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
their own commit. `--improvements=only` makes optional rewrites that adopt 0.19 features once you've upgraded: loops
that call `ctrl.set()` once per row become one [batch `set()`](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#batch-set),
and code that worked around older limits, like `computed()` around Vue composable args, is simplified. A batch runs only
`if (rows.length)` (unless its list is an array literal without a spread).

A batch builds every row and runs `pk()` and `process()` before it writes, so the codemod keeps a loop when that could
read the store or state that changes between rows. It keeps loops:

- whose receiver isn't `ctrl`, `controller` or the result of `useController()`;
- whose row could be an updater function: anything but an object literal, a row of a `JSON.parse()` array (without a
  reviver) that the file only reads and doesn't export, or a value typed as the Entity or a plain object type;
- whose rows could have a getter the file declares, like `[new Live()]`, or whose dropped args read one;
- whose row value calls a function the file declares, or gives a call an argument other than the row, a literal or a
  `const` set to a literal;
- whose row value reads a member of something that could have a getter the file declares: `this`, a variable not set
  to plain data or to what a global or import returns, or a `const` the file stores anything but plain data in or
  hands on (`stash(cfg)`, `return cfg.live`, `const ref = cfg.live`);
- whose Entity isn't declared in the file or imported from a relative path or tsconfig alias, or has
  `static indexes`, decorators, hooks that read args, or an override of `validate()` or a store-merge method;
- whose Entity's `pk()` or `process()` calls a function the file declares (it could read the store), reads a
  variable that can change between rows (`let seq`), a static getter the file declares (`Live.count`,
  `this.count`) or a static field the file writes, or writes through `this`;
- whose Entity's instance code (constructor, method, getter, setter or field value) names a function the file
  declares, reaches `this.constructor` or `new.target`, or calls an overridden `fromJS()`;
- whose Entity's static members the files it reads change, or which they pass to a function outside `@data-client`.

It reads only the Entity's file, the loop's file, barrels between them and the files the schema imports, so a file the
codemod didn't read can still patch the Entity. Three things differ from the loop:

- The batch dispatches one SET action whose `action.schema` is `[Entity]` instead of one per row, so Managers that
  match `action.schema` should check `action.schema[0]`.
- A row that throws while its value is built, or in `pk()` or `process()`, makes the whole batch write nothing, where
  the loop still wrote the rows before it.
- Rows with the same `pk` in one batch merge with each other, so only the first is checked against the stored entity's
  `fetchedAt`. This differs only when the store holds newer data than the client's clock (such as after SSR from a
  server whose clock runs ahead), or when the list holds the same row object twice.

It processes JavaScript and TypeScript files and skips `node_modules`. Other
[jscodeshift options](https://github.com/facebook/jscodeshift#usage-cli) pass through, such as `--dry` and `--print` to
preview changes, or `--extensions` to override the file types.
