---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/test': patch
---

Fix fixtures for [Endpoint](https://dataclient.io/rest/api/Endpoint) never resolving `controller.fetch()`

With [renderDataHook()](https://dataclient.io/docs/api/renderDataHook) `resolverFixtures` or [MockResolver](https://dataclient.io/docs/api/MockResolver), a fixture or interceptor for a plain `Endpoint` stored its response under another key. `controller.fetch()` never resolved, and hooks never saw the response. Fixtures for `RestEndpoint` were not affected.

```ts
import { Endpoint } from '@data-client/endpoint';
import { useController } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

const getValue = new Endpoint(
  ({ id }: { id: number }) => Promise.resolve({ id }),
  { name: 'getValue' },
);

const { controller } = renderDataHook(() => useController(), {
  resolverFixtures: [
    { endpoint: getValue, args: [{ id: 5 }], response: { id: 5 } },
  ],
});
// before: never resolved
await controller.fetch(getValue, { id: 5 });
```
