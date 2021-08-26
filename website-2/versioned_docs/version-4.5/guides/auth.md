---
title: Authentication
id: auth
original_id: auth
---

All network requests are run through the `static fetchOptionsPlugin` optionally
defined in your `Resource`.

## Cookie Auth

Here's an example using simple cookie auth:

<!--DOCUSAURUS_CODE_TABS-->
<!--fetch-->

```typescript
class AuthdResource extends Resource {
  static fetchOptionsPlugin = (options: RequestInit) => ({
    ...options,
    credentials: 'same-origin',
  });
}
```

<!--superagent-->

```typescript
import { Request } from 'rest-hooks';

class AuthdResource extends Resource {
  static fetchPlugin = (request: Request) => request.withCredentials();
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

You can also do more complex flows (like adding arbitrary headers) to
the request. Every `fetchOptionsPlugin` takes in the existing [init options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) of fetch, and returns new init options to be used.

## Auth Headers from React Context

Here we use a context variable to set headers. Note - this means any fetch shape functions can only be
called from a React Component. (However, this should be fine since the context will only exist in React anyway.)

```typescript
class AuthdResource extends Resource {
  static fetchOptionsPlugin = (options: RequestInit) => {
    const { session } = useAuthContext();
    return {
    ...options,
      headers: {
        ...options.headers,
        'Access-Token': session,
      },
    }
  };
}
```


## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
