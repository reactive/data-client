---
title: Using a custom networking library
sidebar_label: Custom networking library
---
`Resource.fetch()` wraps the standard [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
One key customization is ensuring every network related error thrown has a
status member. This is useful in distinguishing code errors from networking errors,
and is used in the [NetworkManager](../api/NetworkManager).

`SimpleResource` can be used as an abstract class to implement custom fetch methods
without including the default.

> Note: If you plan on using [NetworkErrorBoundary](../api/NetworkErrorBoundary) make sure
> to add a `status` member to errors, as it catches only errors with a `status` member.

## Fetch (default)

[Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

The [whatwg-fetch](https://github.com/github/fetch#installation) polyfill will be
useful in environments that don't support it, like node and older browsers
(Internet Explorer). Be sure to include it in any bundles that need it.

This implementation is provided as a useful reference for building your own.
For the most up-to-date implementation, see the [source on master](https://github.com/coinbase/rest-hooks/blob/master/packages/rest-hooks/src/resource/Resource.ts)

```typescript
import SimpleResource from './SimpleResource';

class NetworkError extends Error {
  declare status: number;
  declare response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.status = response.status;
    this.response = response;
  }
}

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
export default abstract class Resource extends SimpleResource {
  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(input: RequestInfo, init: RequestInit) {
    const options: RequestInit = {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // "Content-Type": "application/x-www-form-urlencoded",  -- maybe use this if typeof body is FormData ?
        ...init.headers,
      },
    };
    return fetch(input, options)
      .then(response => {
        if (!response.ok) {
          throw new NetworkError(response);
        }
        return response;
      })
      .catch(error => {
        // ensure CORS, network down, and parse errors are still caught by NetworkErrorBoundary
        if (error instanceof TypeError) {
          (error as any).status = 400;
        }
        throw error;
      });
  }

  /** Perform network request and resolve with json body */
  static fetch(input: RequestInfo, init: RequestInit) {
    return this.fetchResponse(input, init).then((response: Response) => {
      if (
        !response.headers.get('content-type')?.includes('json') ||
        response.status === 204
      )
        return response.text();
      return response.json().catch(error => {
        error.status = 400;
        throw error;
      });
    });
  }
```

## Superagent

[Superagent](http://visionmedia.github.io/superagent/)

```typescript
import request from 'superagent';
import { Method } from '~/types';

import SimpleResource from './SimpleResource';

const ResourceError = `JSON expected but not returned from API`;

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
export default abstract class Resource extends SimpleResource {
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: request.Plugin;

  /** Perform network request and resolve with json body */
  static fetch(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ) {
    let req = request[method](url).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (body) req = req.send(body);
    return req.then(res => {
      if (isInvalidResponse(res)) {
        throw new Error(ResourceError);
      }
      return res.body;
    });
  }
}

export const isInvalidResponse = (res: request.Response): boolean => {
  // Empty is only valid when no response is expect (204)
  const resEmptyIsExpected = res.text === '' && res.status === 204;
  const resBodyEmpty = Object.keys(res.body).length === 0;
  return !(res.type.includes('json') || resEmptyIsExpected) && resBodyEmpty;
};
```

## Axios

[Axios](https://github.com/axios/axios)

```typescript
import { SimpleResource, Method } from 'rest-hooks';
import axios from 'axios';

export default abstract class AxiosResource extends SimpleResource {
  /** Perform network request and resolve with json body */
  static async fetch(
    method: Method,
    url: string,
    body?: Readonly<object | string>
  ) {
    return await axios[method](url, body);
  }
}
```
