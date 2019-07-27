---
title: Using a custom networking library
sidebar_label: Custom networking library
---
The default `fetch()` implementation uses [superagent]() due to it's server-side support
and excellent builder-pattern api. However, a simple overriding of the `fetch()` function
will enable you to use any networking library you please. By extending from `SimpleResource`
instead of `Resource` you can potentially reduce your bundle size by enabling the superagent
library to be tree-shaken away.

### Default fetch with superagent:

```typescript
import request from 'superagent';
import { Method } from '~/types';

import SimpleResource from './SimpleResource';

/** Represents an entity to be retrieved from a server. Typically 1:1 with a url endpoint. */
export default abstract class Resource extends SimpleResource {
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: request.Plugin;

  /** Perform network request and resolve with json body */
  static fetch<T extends typeof Resource>(
    this: T,
    method: Method,
    url: string,
    body?: Readonly<object>,
  ) {
    let req = request[method](url).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (body) req = req.send(body);
    return req.then(res => {
      if (process.env.NODE_ENV !== 'production') {
        if (!res.type.includes('json') && Object.keys(res.body).length === 0) {
          throw new Error('JSON expected but not returned from API');
        }
      }
      return res.body;
    });
  }
}
```

Here are examples using other popular networking APIs:

## Fetch

[Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

```typescript
import { SimpleResource, Method } from 'rest-hooks';

export default abstract class FetchResource extends SimpleResource {
  /** A function to mutate all request options for fetch */
  static fetchOptionsPlugin?: (options: RequestInit) => RequestInit;

  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof SimpleResource>(
    this: T,
    method: Method,
    url: string,
    body?: Readonly<object>
  ) {
    let options: RequestInit = {
      method: method.toUpperCase(),
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        // "Content-Type": "application/x-www-form-urlencoded",  -- maybe use this if typeof body is FormData ?
      },
    };
    if (this.fetchOptionsPlugin) options = this.fetchOptionsPlugin(options);
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const json = (await response).json();
    return json;
  }
}
```

## Axios

[Axios](https://github.com/axios/axios)

```typescript
import { SimpleResource, Method } from 'rest-hooks';
import axios from 'axios';

export default abstract class AxiosResource extends SimpleResource {
  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof AxiosResource>(
    this: T,
    method: Method,
    url: string,
    body?: Readonly<object>
  ) {
    return await axios[method](url, body);
  }
}
```
