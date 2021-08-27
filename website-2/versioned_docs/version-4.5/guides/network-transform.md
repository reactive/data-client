---
title: Transforming data on fetch
id: network-transform
original_id: network-transform
---

All network requests flow through the `fetch()` method, so any transforms needed can simply
be done by overriding it with a call to super.

## Snakes to camels

Commonly APIs are designed with keys using `snake_case`, but many in typescript/javascript
prefer `camelCase`. This snippet lets us make the transform needed.

`CamelResource.ts`

```typescript
import { camelCase, snakeCase } from 'lodash';
import { Method, Resource } from 'rest-hooks';

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
  static async fetch(
    method: Method = 'get',
    url: string,
    body?: Readonly<object | string>,
  ) {
    // we'll need to do the inverse operation when sending data back to the server
    if (body) {
      body = deeplyApplyKeyTransform(body, snakeCase);
    }
    // perform actual network request getting back json
    const jsonResponse = await super.fetch(method, url, body);
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

In this case override the [fromJS()](../api/resource#static-fromjst-extends-typeof-resourcethis-t-props-partialabstractinstancetypet-abstractinstancetypet)
factory method, transforming the fields you wish to change.

```typescript
class MyResource extends Resource {
  readonly createdAt: Date | null = new Date(0);
  readonly largeNumber = BigInt(0);
  // other fields here

  /** MyResource factory. Takes an object of properties to assign to MyResource. */
  static fromJS<T extends typeof Resource>(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ) {
    return super.fromJS({
      ...props,
      createdAt: props.createdAt ? new Date(props.createdAt) : null,
      largeNumber: BigInt(props.largeNumber):
    });
  }
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

`GET https://mystreamsite.tv/ntucker/`

```json
{
  "title": "When I'm Grandmaster, I will play faster.",
  "game": "Starcraft II",
  "current_viewers": 1337,
  "live": true
}
```

`StreamResource.ts`

```typescript
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

  static detailShape<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaDetail<AbstractInstanceType<T>>, { username: string }> {
    const superShape = super.detailShape();
    return {
      ...superShape,
      fetch: async (params: { username: string }, body?: Readonly<object | string>) => {
        const response = await superShape.fetch(params, body);
        response.username = params.username;
        return response;
      },
    };
  }
}
```

## Using HTTP Headers

HTTP [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) are accessible in the fetch
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). [Resource.fetchResponse()](../api/resource#static-fetchresponsemethod-get--post--put--patch--delete--options-url-string-body-readonlyobject--string--promiseresponse)
can be used to construct [FetchShape.fetch()](../api/FetchShape#fetchparams-param-body-payload-promiseany).

Sometimes this is used for cursor based [pagination](./pagination.md#tokens-in-http-headers).

```typescript
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  // same as above....

  /** Shape to get a list of entities */
  static listShape<T extends typeof Resource>(this: T) {
    const fetch = async (params: Readonly<Record<string, string | number>>) => {
      const response = await this.fetchResponse('get', this.listUrl(params));
      return {
        link: response.headers.get('link'),
        results: await response.json().catch((error: any) => {
          error.status = 400;
          throw error;
        }),
      };
    };
    return {
      ...super.listShape(),
      fetch,
      schema: { results: [this.asSchema()], link: '' },
    };
  }
}
```

## Name calling

Sometimes an API might change a key name, or choose one you don't like. Of course
you have much better naming standards, so instead of your `Resource` class definition
and all your code, you just want to remap that key.

`ArticleResource.ts`

```typescript
// We're using camelCase now as well ;)
class ArticleResource extends CamelResource {
  readonly id: string = '';
  readonly title: string = '';
  readonly carrotsUsed: number = 0;

  static async fetch(
    method: Method = 'get',
    url: string,
    body?: Readonly<object | string>,
  ) {
    // we'll need to do the inverse operation when sending data back to the server
    if (body && 'carrotsUsed' in body) {
      // caller should manage body, so we don't want to modify it
      body = { ...body };
      body.carrotsUsedIsThisNameTooLong = body.carrotsUsed;
      delete body.carrotsUsed;
    }
    // perform actual network request getting back json
    const jsonResponse = await super.fetch(method, url, body);
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
