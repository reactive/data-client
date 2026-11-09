---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Type `signal` on every `Endpoint`

A custom [Endpoint](https://dataclient.io/rest/api/Endpoint#signal) can read `this.signal` without declaring it, so `useCancelling()` and `extend({ signal })` cancel SDK calls too. Keep the signal out of the arguments: they are the cache key.

```ts
const getPosts = new Endpoint(
  function ({ page }: { page: number }) {
    return client.getPosts({ page, signal: this.signal });
  },
  { name: 'getPosts', schema: [Post] },
);

useSuspense(useCancelling(getPosts, { page }), { page });
```
