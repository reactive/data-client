---
title: Authentication
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

All network requests are run through the `static getFetchInit` optionally
defined in your `Resource`.

## Cookie Auth

Here's an example using simple cookie auth:

<Tabs
defaultValue="fetch"
values={[
{ label: 'fetch', value: 'fetch' },
{ label: 'superagent', value: 'superagent' },
]}>
<TabItem value="fetch">

```typescript
class AuthdResource extends Resource {
  static getFetchInit = (init: RequestInit): RequestInit => ({
    ...init,
    credentials: 'same-origin',
  });
}
```

</TabItem>
<TabItem value="superagent">

```typescript
import { Resource } from 'rest-hooks';
import type { SuperAgentRequest } from 'superagent';

class AuthdResource extends Resource {
  static fetchPlugin = (request: SuperAgentRequest) =>
    request.withCredentials();
}
```

</TabItem>
</Tabs>

You can also do more complex flows (like adding arbitrary headers) to
the request. Every [getFetchInit()](api/resource#static-getfetchinitinit-requestinit-requestinit) takes in the existing [init options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) of fetch, and returns new init options to be used.

## Auth Headers from React Context

Here we use a context variable to set headers. Note - this means any endpoint functions can only be
called from a React Component. (However, this should be fine since the context will only exist in React anyway.)

```typescript
class AuthdResource extends Resource {
  static useFetchInit = (init: RequestInit) => {
    const accessToken = useAuthContext();
    return {
      ...init,
      headers: {
        ...init.headers,
        'Access-Token': accessToken,
      },
    };
  };
}
```

## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
