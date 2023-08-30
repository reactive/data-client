---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/react': minor
'@data-client/rest': minor
---

BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) *must* support function calls

This means Date will no longer work like before. Possible migrations:

```ts
class Ticker extends Entity {
  trade_id = 0;
  price = 0;
  time = Temporal.Instant.fromEpochSeconds(0);

  pk(): string {
    return `${this.trade_id}`;
  }
  static key = 'Ticker';

  static schema = {
    price: Number,
    time: Temporal.Instant.from,
  };
}
```

or to continue using Date:

```ts
class Ticker extends Entity {
  trade_id = 0;
  price = 0;
  time = Temporal.Instant.fromEpochSeconds(0);

  pk(): string {
    return `${this.trade_id}`;
  }
  static key = 'Ticker';

  static schema = {
    price: Number,
    time: (iso:string) => new Date(iso),
  };
}
```