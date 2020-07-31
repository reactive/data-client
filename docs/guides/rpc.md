---
title: Capturing Mutation Side-Effects
---

## How to deal with side-effects

If you have an endpoint that updates many resources on your server,
there is a straightforward mechanism to get all those updates
to your client in one request.

By defining a custom [Endpoint](api/Endpoint.md) method on your resource,
you'll be able to use custom response endpoints that still
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
endpoint.

`TradeResource.ts`

```typescript
import { Resource } from '@rest-hooks/rest';

class TradeResource extends Resource {
  // ...
  static create<T extends typeof Resource>(this: T) {
    return super.create().extend({
      schema: {
        trade: this,
        account: AccountResource,
      },
    });
  }
}
```

Now if when we use the [create()](../api/Resource.md#create-endpoint) Endpoint generator method,
we will be happy knowing both the trade and account information will
be updated in the cache after the `POST` request is complete.

`CreateTrade.tsx`

```typescript
export default function CreateTrade() {
  const create = useFetcher(TradeResource.create());
  //...
}
```

> #### Note:
>
> Feel free to create completely new [Endpoint](api/Endpoint.md) methods for any custom
> endpoints you have. This endpoint tells `rest-hooks` how to process any
> request.
