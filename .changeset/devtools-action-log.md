---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING: `globalThis.__DC__` replaces `globalThis.__DC_CONTROLLERS__` in development, with each store's Controller and recent actions

Coding agents and console debugging can reach the store with the [Controller](https://dataclient.io/docs/api/Controller)
methods they already know, and see what it dispatched, including the fetches made while the page loaded, without
the Redux DevTools extension. `__DC__.controller` and `__DC__.actions` read the page's store. Each access looks
the store up again, so it keeps working after a provider remounts. Production builds don't include it.

```js title="Browser DevTools console"
__DC__.actions.slice(-10);

// Response for a key in the action log, without importing its endpoint
const c = __DC__.controller;
const a = __DC__.actions.findLast(a => a.args && a.key?.includes('/todos'));
c.getResponse(a.endpoint, ...a.args, c.getState()).data;
```

With several stores on a page, `__DC__.stores` lists their keys and setting `__DC__.store` picks one. Stores with
the same devtools name each get their own key (`'Data Client: My App (2)'`, `(3)`, ...) instead of the second hiding
the first. Debugging code that read `globalThis.__DC_CONTROLLERS__` reads `__DC__` instead:

```js title="Browser DevTools console"
// before
__DC_CONTROLLERS__.get('Data Client: My App').getState();
// after
__DC__.store = 'Data Client: My App';
__DC__.controller.getState();
```

To keep memory small, only the newest 20 actions keep their payloads (older fetches of endpoints without side
effects keep their `args`), and each polling key (endpoint and args) keeps only its last two polls
(`maxPollingActions`, default 4 actions). See [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager#controllers).
