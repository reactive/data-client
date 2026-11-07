---
'@data-client/test': patch
---

Add `managers` option to [renderDataHook()](https://dataclient.io/docs/api/renderDataHook#optionsmanagers)

`renderDataHook()` used to ignore a `managers` option, so a test's Manager never ran. Now pass a function
that returns new Managers; it runs once per `renderDataHook()` call. They replace the default `NetworkManager` and
`SubscriptionManager`, and must include a `NetworkManager`.

```ts
const { controller } = renderDataHook(() => useController(), {
  managers: () => [new LoggingManager(), new NetworkManager()],
});
```
