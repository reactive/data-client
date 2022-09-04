---
title: Transforming data on fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';

All network requests flow through the `fetch()` method, so any transforms needed can simply
be done by overriding it with a call to super.

> Note: If you retain control over the API design, generally it's preferred to
> update the data sent over the network. Keeping the client as `thin` as possible
> is helpful to both performance and complexity.
>
> That said, in many cases you want to consume APIs you don't have control over -
> be they public APIs, or due to internal organizational structure.

## Snakes to camels

Commonly APIs are designed with keys using `snake_case`, but many in typescript/javascript
prefer `camelCase`. This snippet lets us make the transform needed.

```typescript title="CamelResource.ts"
import { camelCase, snakeCase } from 'lodash';
import { Resource } from '@rest-hooks/rest';

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

// We can now extend CamelResource instead of Resource to build
// all of our classes.
abstract class CamelResource extends Resource {
  static async fetch(input: RequestInfo, init: RequestInit) {
    // we'll need to do the inverse operation when sending data back to the server
    if (init.body) {
      init.body = deeplyApplyKeyTransform(init.body, snakeCase);
    }
    // perform actual network request getting back json
    const jsonResponse = await super.fetch(input, init);
    // do the conversion!
    return deeplyApplyKeyTransform(jsonResponse, camelCase);
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

In this case, simply use the [static schema](api/Entity.md#schema) with [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) and [BigNumber](https://github.com/MikeMcl/bignumber.js)

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const exchangeMock = ({ exchangePair }) =>
  Promise.resolve({
    exchangePair,
    price: '32982389239823983298329832.238923982389328932893298',
    updatedAt: new Date().toISOString(),
  });

class ExchangePrice extends Entity {
  readonly exchangePair = '';
  readonly updatedAt = new Date(0);
  readonly price = new BigNumber(0);
  static schema = {
    updatedAt: Date,
    price: BigNumber,
  };
  pk() {
    return this.exchangePair;
  }
}
const getPrice = new Endpoint(exchangeMock, {
  schema: ExchangePrice,
});
function PricePage() {
  const currentPrice = useSuspense(getPrice, { exchangePair: 'btc-usd' });
  return (
    <div>
      {currentPrice.price.toPrecision(2)} as of{' '}
      <time>
        {Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          currentPrice.updatedAt,
        )}
      </time>
    </div>
  );
}
render(<PricePage />);
```

</HooksPlayground>

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

```typescript title="StreamResource.ts"
const USERNAME_MATCHER = /.*\/([^\/]+)\/?/;

abstract class StreamResource extends CamelResource {
  readonly username: string = '';
  readonly title: string = '';
  readonly game: string = '';
  readonly currentViewers: number = 0;
  readonly live: boolean = false;

  pk() {
    return this.username;
  }

  static detail<T extends typeof Resource>(this: T) {
    const superEndpoint = super.detail() as ReadEndpoint<FetchFunction, T>;
    return superEndpoint.extend({
      fetch: async (params: { username: string }) => {
        const response = await superEndpoint.fetch.call(this, params);
        response.username = params.username;
        return response;
      },
      // calling super with generics is broken in TypeScript, so re-defining schema ensures correct typing
      schema: this,
    });
  }
}
```

## Using HTTP Headers

HTTP [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) are accessible in the fetch
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). [Resource.fetchResponse()](api/Resource.md#fetchResponse)
can be used to construct [Endpoint](api/Endpoint.md).

Sometimes this is used for cursor based [pagination](./pagination.md#tokens-in-http-headers).

```typescript
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  // same as above....

  /** Endpoint to get a list of entities */
  static list<T extends typeof Resource>(this: T) {
    const instanceFetchResponse = this.fetchResponse.bind(this);

    return super.list().extend({
      fetch: async function (params: Readonly<Record<string, string | number>>) {
        const response = await instanceFetchResponse(this.url(params), this.init);
        return {
          link: response.headers.get('link'),
          results: await response.json().catch((error: any) => {
            error.status = 400;
            throw error;
        };
      },
      schema: { results: [this], link: '' },
    });
  }
}
```

## Name calling

Sometimes an API might change a key name, or choose one you don't like. Of course
you have much better naming standards, so instead of your `Resource` class definition
and all your code, you just want to remap that key.

```typescript title="ArticleResource.ts"
// We're using camelCase now as well ;)
class ArticleResource extends CamelResource {
  readonly id: string = '';
  readonly title: string = '';
  readonly carrotsUsed: number = 0;

  static async fetch(input: RequestInfo, init: RequestInit) {
    // we'll need to do the inverse operation when sending data back to the server
    if (init.body && 'carrotsUsed' in init.body) {
      // caller should manage init & body, so we don't want to modify it
      init = { ...init, body: { ...init.body } };
      init.body.carrotsUsedIsThisNameTooLong = init.body.carrotsUsed;
      delete init.body.carrotsUsed;
    }
    // perform actual network request getting back json
    const jsonResponse = await super.fetch(input, init);
    // only replace the name if it exists. This also helps us ignore list responses.
    if ('carrotsUsedIsThisNameTooLong' in jsonResponse) {
      // ok to mutate jsonResponse since we control it
      jsonResponse.carrotsUsed = jsonResponse.carrotsUsedIsThisNameTooLong;
      delete jsonResponse.carrotsUsedIsThisNameTooLong;
    }
    return jsonResponse;
  }
}
```
