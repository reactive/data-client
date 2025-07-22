---
title: Transforming data on fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

All network requests flow through the `fetch()` method, so any transforms needed can simply
be done by overriding it with a call to super.

:::tip

Note: If you retain control over the API design, generally it's preferred to
update the data sent over the network. Keeping the client as `thin` as possible
is helpful to both performance and complexity.

That said, in many cases you want to consume APIs you don't have control over -
be they public APIs, or due to internal organizational structure.

:::

## Snakes to camels

Commonly APIs are designed with keys using `snake_case`, but many in typescript/javascript
prefer `camelCase`. This snippet lets us make the transform needed.

```typescript title="CamelResource.ts"
import { camelCase, snakeCase } from 'lodash';
import { RestEndpoint, RestGenerics  } from '@data-client/rest';

function deeplyApplyKeyTransform(obj: any, transform: (key: string) => string) {
  const ret: Record<string, any> = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    if (obj[key] != null && typeof obj[key] === 'object') {
      ret[transform(key)] = deeplyApplyKeyTransform(obj[key], transform);
    } else {
      ret[transform(key)] = obj[key];
    }
  });
  return ret;
}

class CamelEndpoint<O Extends RestGenerics = any> extends RestEndpoint<O> {
  getRequestInit(body) {
    // we'll need to do the inverse operation when sending data back to the server
    if (body) {
      return super.getRequestInit(deeplyApplyKeyTransform(body, snakeCase));
    }
    return super.getRequestInit(body);
  }
  process(value) {
    return deeplyApplyKeyTransform(value, camelCase);
  }
}
```

## Deserializing fields

In many cases, data sent through JSON is serialized into strings since JSON
only has a few primitive types. Common examples include [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
for dates or even strings for decimals that require high precision ([floats can be lossy](https://floating-point-gui.de/)).
Keeping data in the serialized form is often fine, especially if it is only being used to
be displayed. However, this can be problematic when derived data is computed like adding time to a date
or multiplying two numbers.

In this case, simply use the [static schema](api/Entity.md#schema) with [Temporal.Instant](https://tc39.es/proposal-temporal/) and [BigNumber](https://github.com/MikeMcl/bignumber.js)

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/price/:exchangePair'}),
args: [{ exchangePair: 'btc-usd' }],
response: {
exchangePair: 'btc-usd',
price: '32982389239823983298329832.238923982389328932893298',
updatedAt: new Date().toISOString(),
},
delay: 150,
},
]}>

```tsx title="api/Price"
import BigNumber from 'bignumber.js';

export class ExchangePrice extends Entity {
  exchangePair = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);
  price = new BigNumber(0);
  pk() {
    return this.exchangePair;
  }
  static key = 'ExchangePrice';

  static schema = {
    updatedAt: Temporal.Instant.from,
    price: BigNumber,
  };
}
export const getPrice = new RestEndpoint({
  path: '/price/:exchangePair',
  schema: ExchangePrice,
});
```

```tsx title="PricePage"
import { getPrice } from './api/Price';

function PricePage() {
  const currentPrice = useSuspense(getPrice, {
    exchangePair: 'btc-usd',
  });
  return (
    <div>
      ${currentPrice.price.toFormat(2)} as of{' '}
      <time>
        {DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          currentPrice.updatedAt,
        )}
      </time>
    </div>
  );
}
render(<PricePage />);
```

</HooksPlayground>

### Deserializing Date

In case you want to use legacy [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date),
you can turn the constructor into a function [schema](../api/schema.md).

```ts
export class ExchangePrice extends Entity {
  exchangePair = '';
  updatedAt = new Date(0);
  price = new BigNumber(0);
  pk() {
    return this.exchangePair;
  }
  static key = 'ExchangePrice';

  static schema = {
    // highlight-next-line
    updatedAt: iso => new Date(iso),
    price: BigNumber,
  };
}
```

## Case of the missing `Id`

You now want to interface with a great new streaming site called `mystreamsite.tv`. It has
a simple API to retireve information about current streams. You can get a stream with the
url pattern `https://mystreamsite.tv/[username]/`. However, for some reason they don't
return the username in the response body! You want to be able to refer to it and it's
the only uniquely defining identifier for the class.

We can simply parse the username from the request url itself and add that to the
response.

```json title="GET https://mystreamsite.tv/ntucker/"
{
  "title": "When I'm Grandmaster, I will play faster.",
  "game": "Starcraft II",
  "current_viewers": 1337,
  "live": true
}
```

```typescript title="api/Stream.ts"
const USERNAME_MATCHER = /.*\/([^\/]+)\/?/;

class Stream extends Entity {
  username = '';
  title = '';
  game = '';
  currentViewers = 0;
  live = false;

  pk() {
    return this.username;
  }
  static key = 'Stream';
}

const getStream = new RestEndpoint({
  urlPrefix: 'https://mystreamsite.tv',
  path: '/:username',
  schema: Stream,
  // highlight-start
  process(value, { username }) {
    value.username = username;
    return value;
  },
  // highlight-end
});
```

### Ticker prices

Here's a real world example of an API that does where ticket data does not include its primary key `product_id`.

We use [RestEndpoint.process()](../api/RestEndpoint.md#process) to add the `product_id` member from its argument.

<HooksPlayground row>

```typescript title="Ticker" {28-31}
import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = '0';
  time = Temporal.Instant.fromEpochMilliseconds(0);
  bid = '0';
  ask = '0';
  volume = '';

  pk(): string {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = {
    price: Number,
    time: Temporal.Instant.from,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  process(value, { productId }) {
    value.product_id = productId;
    return value;
  },
  pollFrequency: 2000,
});
```

```tsx title="AssetPrice" {5} collapsed
import { useLive } from '@data-client/react';
import { getTicker } from './Ticker';

function AssetPrice({ productId }: Props) {
  const ticker = useLive(getTicker, { productId });
  return (
    <center>
      {productId}{' '}
      <NumberFlow
        value={ticker.price}
        format={{ style: 'currency', currency: 'USD' }}
      />
    </center>
  );
}
interface Props {
  productId: string;
}
render(<AssetPrice productId="BTC-USD" />);
```

</HooksPlayground>

## Using HTTP Headers

HTTP [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) are accessible in the fetch
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). [RestEndpoint.fetchResponse()](../api/RestEndpoint.md#fetchResponse)
can be used to construct [RestEndpoint](../api/RestEndpoint.md).

Sometimes this is used for cursor based [pagination](./pagination.md#tokens-in-http-headers).

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }
}
```

## Name calling

Sometimes an API might change a key name, or choose one you don't like. Of course
you have much better naming standards, so instead of your `Resource` class definition
and all your code, you just want to remap that key.

```typescript title="ArticleResource.ts"
class RenamedEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body) {
    if (body && 'carrotsUsed' in body) {
      const newBody = {
        ...body,
        carrotsUSedIsThisNameTooLong: carrotsUsed,
      };
      delete newBody.carrotsUsed;
      return super.getRequestInit(newBody);
    }
    return super.getRequestInit(body);
  }
  process(value) {
    if ('carrotsUsedIsThisNameTooLong' in value) {
      // ok to mutate jsonResponse since we control it
      value.carrotsUsed = value.carrotsUsedIsThisNameTooLong;
      delete value.carrotsUsedIsThisNameTooLong;
    }
    return value;
  }
}
```
