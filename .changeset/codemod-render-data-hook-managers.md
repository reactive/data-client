---
'@data-client/codemods': patch
---

Convert `managers` arrays passed to [renderDataHook()](https://dataclient.io/docs/api/renderDataHook#optionsmanagers) in the `v0.19` codemod

Before, `renderDataHook()` ignored `managers`; now the converted list runs instead of the defaults, so it must include a `NetworkManager` (`renderDataHook()` throws if it doesn't).

```ts
renderDataHook(() => useThing(), { managers: [new NetworkManager(), logger] });
// becomes
renderDataHook(() => useThing(), {
  managers: () => [new NetworkManager(), logger],
});
```
