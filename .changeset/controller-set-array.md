---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` types for Array schemas

`controller.set([Entity], rows)` and `controller.set(new schema.Array(Entity), rows)` now typecheck. This writes every row in one store update: each row merges with its stored entity, and entities not in `rows` stay.

Rows are typed by the Entity's fields. The schema must be one Entity or [Union](https://dataclient.io/rest/api/Union) in an Array or [Values](https://dataclient.io/rest/api/Values) (which takes an object keyed by id).

```ts
// Before: TypeScript error on [Ticker], so batches became one set() per row
for (const row of rows) {
  ctrl.set(Ticker, { product_id: row.product_id }, row);
}

// After: one store update
ctrl.set([Ticker], rows);
ctrl.set(new schema.Values(Ticker), { 'BTC-USD': row });

// TypeScript errors
ctrl.set([Ticker, Product], rows); // use a Union for mixed types
ctrl.set([Ticker], [{ price: true }]); // price is a number
```
