---
title: Authentication
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
import { Resource } from 'rest-hooks';

class AuthdResource extends Resource {
  static fetchOptionsPlugin(options: RequestInit): RequestInit {
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

When doing this calls outside the context of React functional component will result in
exceptions thrown. This makes sense as outside that context we cannot even access the necessary
data to provide authentication. Furthermore, FetchShapes are only used as arguments to the hooks
of Rest Hooks, so use in callbacks should not be of concern. For instance, here's an imperative call
to fetch:

```tsx
function UpdateForm({ id }: { id: string }) {
  const update = useFetcher(MyResource.updateShape());

  const handleSubmit = useCallback((data) => {
    update({ id }, data);
  }, [nextPage])

  return <Form onSubmit={handleSubmit}><Fields/></Form>
}
```

### Rules of hooks enforcement

If you're very concerned about calling the shape functions outside the context of React,
you can provide your own `use` prefixed versions like so.

```typescript
import { Resource } from 'rest-hooks';

class AuthdResource extends Resource {
  static fetchOptionsPlugin(options: RequestInit): RequestInit {
    const { session } = useAuthContext();
    return {
      ...options,
      headers: {
        ...options.headers,
        'Access-Token': session,
      },
    }
  };

  static useDetail<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.detailShape();
  }

  static useList<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.listShape();
  }

  static useCreate<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.createShape();
  }

  static useUpdate<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.updateShape();
  }

  static usePartialUpdate<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.partialUpdateShape();
  }

  static useDelete<T extends typeof AuthdResource>(
    this: T,
  ) {
    return this.deleteShape();
  }
}
```


## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.
