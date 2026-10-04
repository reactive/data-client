---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` types for Array schemas

`controller.set([Entity], rows)` and `controller.set(new schema.Array(Entity), rows)` now typecheck. This writes every row in one store update: each row merges with its stored entity, and entities not in `rows` stay.

Rows are typed by the Entity's fields. The schema holds one Entity, [Union](https://dataclient.io/rest/api/Union) (for mixed types) or [Invalidate](https://dataclient.io/rest/api/Invalidate) (to delete), in an Array or [Values](https://dataclient.io/rest/api/Values) (which takes an object keyed by id).

Batch `set()` needs `@data-client/rest` (or `endpoint`/`graphql`) from this release, since older Entity classes don't type as `EntityInterface`.

```ts
// Before: TypeScript error on [Ticker], so batches became one set() per row
for (const row of rows) {
  ctrl.set(Ticker, { product_id: row.product_id }, row);
}

// After: one store update
ctrl.set([Ticker], rows);

// Mixed Entity types, batch deletes, and rows keyed by id
const Message = new schema.Union({ ticker: Ticker, trade: Trade }, 'type');
ctrl.set([Message], messages);
ctrl.set([new schema.Invalidate(Ticker)], [{ product_id: 'BTC-USD' }]);
ctrl.set(new schema.Values(Ticker), { 'BTC-USD': row });
```
