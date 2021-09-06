---
title: Authentication
id: auth
original_id: auth
---

All network requests are run through the `static fetchOptionsPlugin` optionally
defined in your `Resource`.

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

## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
