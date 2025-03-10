---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Support dynamic invalidation/deletes

Returning `undefined` from [Entity.process](https://dataclient.io/rest/api/Entity#process)
will cause the [Entity](https://dataclient.io/rest/api/Entity) to be [invalidated](https://dataclient.io/docs/concepts/expiry-policy#invalidate-entity).
This this allows us to invalidate dynamically; based on the particular response data.

```ts
class PriceLevel extends Entity {
  price = 0;
  amount = 0;

  pk() {
    return this.price;
  }

  static process(
    input: [number, number],
    parent: any,
    key: string | undefined,
  ): any {
    const [price, amount] = input;
    if (amount === 0) return undefined;
    return { price, amount };
  }
}
```
