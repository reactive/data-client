---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/test': patch
---

[Fixtures](https://dataclient.io/docs/api/Fixtures) honor the fetch's AbortSignal, and `fetchResponse()` interceptors can be async

Aborting a mocked fetch (with [useCancelling()](https://dataclient.io/docs/api/useCancelling) or an endpoint's `signal`) rejects it with an `AbortError` while its [delay](https://dataclient.io/docs/api/Fixtures#delay) runs, as `fetch()` would, instead of resolving later. So tests and mocked demos can show cancellation.

A [fetchResponse()](https://dataclient.io/docs/api/Fixtures#fetchResponse) interceptor may return a promise, and reads the signal from `init.signal`:

```ts
const slowUpload = {
  endpoint: UploadResource.create,
  async fetchResponse(input, init) {
    await waitForServer(init.signal);
    return { id: 1, done: true };
  },
};
```
