---
'@data-client/codemods': patch
---

Add optional `--improvements` to the `v0.19` codemod, to adopt 0.19 features after upgrading

None of these are needed to upgrade. Run them in their own commit with
`npx @data-client/codemods v0.19 src/ --improvements=only`. The codemod rewrites only code whose result it can prove is
the same, apart from the differences noted below:

- A loop that calls `ctrl.set()` once per row becomes one
  [batch set()](https://dataclient.io/docs/api/Controller#set-array), which updates the store once. The loop can be
  `for...of`, `forEach()`, `rows.map()` or `Promise.all(rows.map())`. The codemod batches it only when all of these
  hold:
  - The receiver is a Controller: `ctrl`, `controller` or the result of `useController()`.
  - Each row is plain data, not an updater function: an object literal, a row of `JSON.parse()` without a reviver, or
    a value typed as the Entity or a plain object type.
  - The row calls only globals, imports and methods of values built from the row. Their arguments use only the row,
    literals and `const`s set to a literal. Loop variable defaults are literals, names, or arrays and objects of
    them.
  - The Entity is a class declared in the file, or imported from a relative path or tsconfig alias.
  - Its `pk()` and `process()` read only the row and call only globals, imports and methods of the row. Its instance
    code (constructor, methods, getters, setters and field values, which `pk()` can reach through `this`) names only
    types, globals, imports, its own variables, `const`s set to a literal, lookup tables of plain data and Entity
    classes it constructs (`author = User.fromJS()`), and never reaches static members (`this.constructor` or
    `new.target`). It has no `static indexes` and
    no decorators, and overrides neither `validate()` nor the store-merge methods.
  - No code the codemod reads changes its static members or passes the class to a function outside `@data-client`:
    its own file, the loop's file, a barrel it is imported through, and the files its schema imports. Check that no
    other file patches a batched Entity.

  A batch over a list that can be empty is guarded with `if (rows.length)`, so an empty list still dispatches nothing.
  Three things differ from the loop:
  - Managers that match SET actions by `action.schema` see one `[Ticker]` action instead of one `Ticker` action per
    row. Match `action.schema[0]`.
  - A row that throws while its value is built, or in `pk()` or `process()`, makes the whole batch write nothing. The
    loop still wrote the rows before it.
  - Rows with the same `pk` merge with each other, so only the first is checked against the stored entity's
    `fetchedAt`. This differs only when the store holds newer data than the client's clock (such as after SSR from a
    server whose clock runs ahead), or when the list holds the same row object twice.

- `ctrl.set([new Invalidate(Todo)], [{ id }])` becomes `ctrl.set(new Invalidate(Todo), { id })`
  ([example](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#set-invalidate)). Its SET action's `action.schema`
  is then the `Invalidate` instead of an Array.
- Vue: drops `gcPolicy: new GCPolicy()`, now `DataClientPlugin`'s default
  ([example](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#vue-gc)); imports `GCPolicy` from
  `@data-client/vue` instead of `@data-client/core`; and replaces `computed(() => args)` passed to a composable with
  the getter itself ([example](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#vue-getter-args)).
- Drops `|| typeof data === 'symbol'` (and `&& typeof data !== 'symbol'`) from conditions on React `useCache()` and
  `useDLE()` data, which is `undefined` instead of a Symbol
  ([example](https://dataclient.io/blog/2026/11/17/v0.19-batch-set#deleted-entity-undefined)).

```ts
ws.onmessage = event => {
  const rows = JSON.parse(event.data);
  for (const row of rows) {
    ctrl.set(Ticker, { product_id: row.product_id }, row);
  }
};
// becomes
ws.onmessage = event => {
  const rows = JSON.parse(event.data);
  if (rows.length) {
    ctrl.set([Ticker], rows);
  }
};
```
