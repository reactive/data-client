---
'@data-client/codemods': patch
---

Add optional `--improvements` to the `v0.19` codemod, to adopt 0.19 features after upgrading

None of these are needed to upgrade. Run them in their own commit with
`npx @data-client/codemods v0.19 src/ --improvements=only`. The codemod rewrites only code whose result it can prove is
the same, apart from the differences noted below:

- A loop that calls `ctrl.set()` once per row becomes one
  [batch set()](https://dataclient.io/docs/api/Controller#set-array), which updates the store once. The loop can be
  `for...of`, `forEach()`, `rows.map()` or `Promise.all(rows.map())`. The codemod batches it only when each row is
  plain data and nothing the loop runs (the row's value and args, the Entity's `pk()`, `process()` and instance
  code) can read the store or state that changes between rows. The
  [codemods README](https://github.com/reactive/data-client/tree/master/packages/codemods#readme) lists what it
  keeps as a loop. It reads only the Entity's file, the loop's file, barrels between them and the files the schema
  imports, so check that no other file patches a batched Entity.

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
