# Transforming data on network load

All network requests flow through the `fetch()` method, so any transforms needed can simply
be done by overrided it with a call to super.

## Examples

### Snakes to camels

Commonly APIs are designed with keys using `snake_case`, but many in typescript/javascript
prefer `camelCase`. This snippet let's us make the transform needed.

`CamelResource.ts`
```typescript
import { camelCase, snakeCase } from 'lodash';
import { Method, Resource } from 'rest-hooks';

function deeplyApplyKeyTransform(obj: any, transform: (key: string) => string) {
  const ret: {[key:string]: any} = Array.isArray(obj) ? [] : {};
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
  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>,
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

### Name calling

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

  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>,
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

### Case of the missing `Id`

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

  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>,
  ) {
    const jsonResponse = await super.fetch(method, url, body);
    // this looks like a detail response, so let's add the data
    if ('currentViewers' in jsonResponse) {
      jsonResponse.username = USERNAME_MATCHER.match(url)[1];
    }
    return jsonResponse;
  }
}
```
