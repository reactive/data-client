---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix fixtures for [Endpoint](https://dataclient.io/rest/api/Endpoint) never resolving `controller.fetch()`

With [renderDataHook()](https://dataclient.io/docs/api/renderDataHook) `resolverFixtures` or [MockResolver](https://dataclient.io/docs/api/MockResolver), a fixture or interceptor for a plain `Endpoint` stored its response under another key. `controller.fetch()` never resolved, and hooks never saw the response. Fixtures for `RestEndpoint` were not affected.

```ts
const getValue = new Endpoint(fetchValue, { name: 'getValue' });

const { controller } = renderDataHook(() => useController(), {
  resolverFixtures: [
    { endpoint: getValue, args: [{ id: 5 }], response: { id: 5 } },
  ],
});
// before: never resolved
await controller.fetch(getValue, { id: 5 });
```
