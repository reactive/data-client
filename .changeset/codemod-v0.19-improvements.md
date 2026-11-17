---
'@data-client/codemods': patch
---

Add optional `--improvements` to the `v0.19` codemod, to adopt 0.19 features after upgrading

None of these are needed to upgrade. Run them in their own commit with
`npx @data-client/codemods v0.19 src/ --improvements=only`. The codemod rewrites only code whose result it can prove is
the same, apart from the two batch differences below:

- A loop that calls `ctrl.set()` once per row (`for...of`, `forEach()`, or `await Promise.all(rows.map())`) becomes
  one [batch set()](https://dataclient.io/docs/api/Controller#set-array), which updates the store once. It does this
  when the receiver is a Controller (`ctrl`, `controller` or `useController()`), each row is plain data (an object
  literal, a row of parsed JSON, or typed as the Entity or a plain object type) rather than an updater function, and
  the Entity is a class declared in the file or imported from a relative path or tsconfig alias whose `pk()` and
  `process()` read only the row, that overrides neither `validate()` nor the store-merge methods, and whose static
  members nothing in the files that declare, import or use it changes.
  Managers that match SET actions by `action.schema` now see `[Ticker]` instead of `Ticker`, and a row whose
  `pk()` or `process()` throws makes the whole batch write nothing, where the loop still wrote some of the other rows.
- `ctrl.set([new Invalidate(Todo)], [{ id }])` becomes `ctrl.set(new Invalidate(Todo), { id })`.
- Vue: drops `gcPolicy: new GCPolicy()`, now `DataClientPlugin`'s default; imports `GCPolicy` from `@data-client/vue`
  instead of `@data-client/core`; and replaces `computed(() => args)` passed to a composable with the getter itself.
- Drops `typeof data === 'symbol'` guards on React `useCache()` and `useDLE()` data, which is `undefined` instead.

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
  ctrl.set([Ticker], rows);
};
```
