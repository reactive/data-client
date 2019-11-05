---
title: Using a custom networking library
sidebar_label: Custom networking library
id: version-1.6.9-custom-networking
original_id: custom-networking
---
The default `fetch()` implementation uses [superagent]() due to it's server-side support
and excellent builder-pattern api. However, a simple overriding of the `fetch()` function
will enable you to use any networking library you please.

### Default fetch with superagent:

```typescript
  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>,
  ) {
    let req = request[method](url).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (body) req = req.send(body);
    const json = (await req).body;
    return json;
  }
```

Here are examples using other popular networking APIs:

## [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

```typescript
import { Resource, Method } from 'rest-hooks';

export default abstract class FetchResource extends Resource {
  /** A function to mutate all request options for fetch */
  static fetchOptionsPlugin?: (options: RequestInit) => RequestInit;

  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>
  ) {
    let options = {
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
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response).json();
    return json;
  }
}
```

## [Axios](https://github.com/axios/axios)

```typescript
import { Resource, Method } from 'rest-hooks';
import axios from 'axios';

export default abstract class AxiosResource extends Resource {
  /** Perform network request and resolve with json body */
  static async fetch<T extends typeof Resource>(
    this: T,
    method: Method = 'get',
    url: string,
    body?: Readonly<object>
  ) {
    return await axios[method](url, body);
  }
}
```
