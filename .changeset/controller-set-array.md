---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` types for Array schemas

`controller.set([Entity], rows)` and `controller.set(new schema.Array(Entity), rows)` now typecheck. This writes every row in one store update: each row merges with its stored entity, and entities not in `rows` stay.

```ts
// Before: TypeScript error on [Ticker], so batches became one set() per row
for (const row of rows) {
  ctrl.set(Ticker, { product_id: row.product_id }, row);
}

// After: one store update
ctrl.set([Ticker], rows);
```
