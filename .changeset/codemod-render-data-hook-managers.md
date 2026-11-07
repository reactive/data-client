---
'@data-client/codemods': patch
---

`v0.19` codemod converts `managers` arrays passed to [renderDataHook()](https://dataclient.io/docs/api/renderDataHook#optionsmanagers)

```ts
renderDataHook(() => useThing(), { managers: [new NetworkManager(), logger] });
// becomes
renderDataHook(() => useThing(), { managers: () => [new NetworkManager(), logger] });
```
