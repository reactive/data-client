---
title: Aborting Fetch
---

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) provides a new way of cancelling
fetches that are no longer considered relevant. This can be hooked into fetch via the second `RequestInit` parameter.

## Resource

Easy integration is provided with the [RestEndpoint](/rest/api/RestEndpoint) via the signal member:

```typescript
const abort = new AbortController();
const AbortableArticle = CoolerArticleResource.get.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

## Endpoint

Additionally similar functionality can easily be added to any endpoint using custom members.

```typescript
type Params = { id: string };

const UserDetail = new Endpoint(
  function ({ id }: Params) {
    const init: RequestInit = {};
    if (this.signal) {
      init.signal = this.signal;
    }
    return fetch(this.url({ id }), init).then(res => res.json()) as Promise<
      typeof payload
    >;
  },
  {
    url({ id }: Params) { return `/users/${id}` },
    signal: undefined as AbortSignal | undefined,
  },
);
```

```typescript
const abort = new AbortController();
const AbortableUserDetail = UserDetail.extend({
  signal: abort.signal,
});
// ...somewhere later trigger cancellation
abort.abort();
```

## Cancelling on params change

Sometimes a user has the opportunity to fill out a field that is used to affect the results of a network call.
If this is a text input, they could potentially type quite quickly, thus creating a lot of network requests.

Using `@rest-hooks/hooks` package with [useCancelling()](../api/useCancelling) will automatically cancel in-flight requests if the parameters
change before the request is resolved.

```tsx
import { useCancelling } from '@rest-hooks/hooks';

const CancelingUserList = useCancelling(UserList, { query });
const users = useSuspense(CancelingUserList, { query });
```

> Warning: Be careful when using this with many disjoint components fetching the same
> arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
> which means you might end up canceling a fetch that another component still cares about.
