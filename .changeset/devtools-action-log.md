---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Add `globalThis.__DC__` in development, with each store's Controller and recent actions

Coding agents and console debugging can reach the store with the [Controller](https://dataclient.io/docs/api/Controller)
methods they already know, and see what it dispatched, including the fetches made while the page loaded, without
the Redux DevTools extension. `__DC__.controller` and `__DC__.actions` read the page's store; with several stores,
`__DC__.stores` lists their keys and setting `__DC__.store` picks one. Each access looks the store up again, so it
keeps working after a provider remounts. Production builds don't include it.

```js title="Browser DevTools console"
__DC__.actions.slice(-10);

// Response for a key in the action log, without importing its endpoint
const c = __DC__.controller;
const a = __DC__.actions.findLast(a => a.args && a.key?.includes('/todos'));
c.getResponse(a.endpoint, ...a.args, c.getState()).data;
```

To keep memory small, only the newest 20 actions keep their payloads (older fetches of endpoints without side
effects keep their `args`), and each polling key (endpoint and args) keeps only its last two polls
(`maxPollingActions`, default 4 actions). See [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager#controllers).
