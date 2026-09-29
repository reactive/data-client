---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `controller.set()` types for Array schemas

`controller.set([Entity], rows)` and `controller.set(new schema.Array(Entity), rows)` now typecheck. This writes every row in one normalize: entities merge, and entities not in `rows` stay in the store.

```ts
ctrl.set(
  [Ticker],
  [
    { product_id: 'BTC-USD', price: 100 },
    { product_id: 'ETH-USD', price: 10 },
  ],
);
```
