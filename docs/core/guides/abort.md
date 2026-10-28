---
title: Aborting Fetch
---

import UseCancelling from '../shared/\_useCancelling.mdx';

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

::::react

## Cancelling on params change

When params change quickly, like a reader skimming an inbox, every message they pass starts a download.
Each response is stored under its own params, so a late one never replaces what's on screen. But the
downloads they've left behind keep going, sharing a slow connection with the one they actually want.

[useCancelling()](/docs/api/useCancelling) aborts the in-flight request as soon as the params change, so
the message the reader stops on downloads alone.

<UseCancelling />

:::warning[Warning]

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::

::::
