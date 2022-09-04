---
title: Using a custom networking library
sidebar_label: Custom networking library
---
import CodeBlock from '@theme/CodeBlock';
import ResourceSource from '!!raw-loader!@site/../packages/rest/src/BaseResource.ts';

`Resource.fetch()` wraps the standard [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
One key customization is ensuring every network related error thrown has a
status member. This is useful in distinguishing code errors from networking errors,
and is used in the [NetworkManager](/docs/api/NetworkManager).

`SimpleResource` can be used as an abstract class to implement custom fetch methods
without including the default.


:::caution

If you plan on using [NetworkErrorBoundary](/docs/api/NetworkErrorBoundary) make sure
to add a `status` member to errors, as it catches only errors with a `status` member.

:::

## Fetch (default)

[Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

The [whatwg-fetch](https://github.com/github/fetch#installation) polyfill will be
useful in environments that don't support it, like node and older browsers
(Internet Explorer). Be sure to include it in any bundles that need it.

<CodeBlock className="language-typescript">{ResourceSource}</CodeBlock>

## Superagent

[Superagent](https://visionmedia.github.io/superagent/)

```typescript
import { Resource, Method } from '@rest-hooks/rest';
import type { SuperAgentRequest } from 'superagent';

const ResourceError = `JSON expected but not returned from API`;

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
export default abstract class SuperResource extends Resource {
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: (request: SuperAgentRequest) => SuperAgentRequest;

  /** Perform network request and resolve with json body */
  static async fetch(
    input: RequestInfo, init: RequestInit
  ) {
    let req = request[init.method](input).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (init.body) req = req.send(init.body);
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
import { Resource, Method } from '@rest-hooks/rest';
import axios from 'axios';

export default abstract class AxiosResource extends Resource {
  /** Perform network request and resolve with json body */
  static async fetch(
    input: RequestInfo, init: RequestInit
  ) {
    return await axios[init.method](input, init.body);
  }
}
```
