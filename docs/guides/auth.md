---
title: Authentication
---
All network requests are run through the `static fetchPlugin` optionally
defined in your `Resource`.

Here's an example using simple cookie auth:

```typescript
import { Request } from 'rest-hooks';

class AuthdResource extends Resource {
  static fetchPlugin = (request: Request) => request.withCredentials();
}
```

You can also do more complex flows (like adding arbitrary headers) to
the request. Every `fetchPlugin` will take in a [superagent](http://visionmedia.github.io/superagent/)
`Request` and return a new `Request`. `Superagent` uses the builder
pattern so this is quite easy.

## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
