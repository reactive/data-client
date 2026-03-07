---
'@data-client/test': patch
---

Add per-render `cleanup()` and `allSettled()` to makeRenderDataHook return value

Each `renderDataHook()` call now returns `cleanup` and `allSettled` directly on the result object, ensuring each render's managers can be independently cleaned up. This prevents manager leaks when `renderDataHook()` is called multiple times in a test.

New exports: `RenderDataHookResult`

```ts
const { result, cleanup, allSettled } = renderDataHook(
  () => useSuspense(MyResource.get, { id: 5 }),
  { initialFixtures },
);
// ... assertions ...
cleanup();
```
