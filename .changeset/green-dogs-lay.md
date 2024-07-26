---
'@data-client/normalizr': patch
'@data-client/endpoint': patch
'@data-client/react': patch
'@data-client/core': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

[Query](https://dataclient.io/rest/api/Query) can take [Object Schemas](https://dataclient.io/rest/api/Object)

This enables joining arbitrary objects (whose pk works with the same arguments.)

```ts
class Ticker extends Entity {
  product_id = '';
  price = 0;

  pk(): string {
    return this.product_id;
  }
}
class Stats extends Entity {
  product_id = '';
  last = 0;

  pk(): string {
    return this.product_id;
  }
}
const queryPrice = new schema.Query(
  { ticker: Ticker, stats: Stats },
  ({ ticker, stats }) => ticker?.price ?? stats?.last,
);
```
