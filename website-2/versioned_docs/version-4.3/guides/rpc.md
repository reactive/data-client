---
title: Capturing Mutation Side-Effects
id: rpc
original_id: rpc
---

## How to deal with side-effects

If you have an endpoint that updates many resources on your server,
there is a straightforward mechanism to get all those updates
to your client in one request.

By defining a custom [FetchShape](../api/FetchShape.md) method on your resource,
you'll be able to use custom response shapes that still
updated `rest-hooks`' normalized cache.

### Example:

You're running a crypto trading platform called `dogebase`. Every time
a user creates a trade, you need to update some balance information
in their accounts object. So upon `POST`ing to the `/trade/` endpoint,
you nest both the updated accounts object along with the trade you just
created.

`POST /trade/`

```json
{
  "trade": {
    "id": 2893232,
    "user": 1,
    "amount": "50.2335324",
    "coin": "doge",
    "created_at": ""
  },
  "account": {
    "id": 899,
    "user": 1,
    "balance": "1337.00",
    "coin_value": "3.50"
  }
}
```

To handle this, we just need to update the `schema` to include the custom
shape.

`TradeResource.ts`

```typescript
import { Resource } from 'rest-hooks';

class TradeResource extends Resource {
  // ...
  static createShape<T extends typeof Resource>(this: T) {
    return {
      ...super.createShape(),
      schema: {
        trade: this.asSchema(),
        account: AccountResource.asSchema(),
      },
    };
  }
}
```

Now if when we use the [createShape()](../api/Resource.md#createshape) FetchShape generator method,
we will be happy knowing both the trade and account information will
be updated in the cache after the `POST` request is complete.

`CreateTrade.tsx`

```typescript
export default function CreateTrade() {
  const create = useFetcher(TradeResource.createShape());
  //...
}
```

> #### Note:
>
> Feel free to create completely new [FetchShape](../api/FetchShape.md) methods for any custom
> endpoints you have. This shape tells `rest-hooks` how to process any
> request.
