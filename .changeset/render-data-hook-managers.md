---
'@data-client/test': patch
---

Add `managers` option to [renderDataHook()](https://dataclient.io/docs/api/renderDataHook#optionsmanagers)

`renderDataHook()` used to ignore a `managers` option, so a test's Manager never ran. Now pass a function
that returns new Managers; it runs once per render. They replace the default `NetworkManager` and
`SubscriptionManager`, so include `NetworkManager` when the test fetches.

```ts
const { controller } = renderDataHook(() => useController(), {
  managers: () => [new LoggingManager(), new NetworkManager()],
});
```
