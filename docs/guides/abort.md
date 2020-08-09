---
title: Aborting Fetch
---

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) provides a new way of cancelling
fetches that are no longer considered relevant. This can be hooked into fetch via the second `RequestInit` parameter.

## Resource

Easy integration is provided with the [Endpoint](../api/Endpoint)s defined in [Resource](../api/resource) via the signal member:

```typescript
const abort = new AbortController();
const AbortableArticle = CoolerArticleResource.detail().extend({
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
