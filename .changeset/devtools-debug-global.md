---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Add `globalThis.__DC__` in development to read a store's Controller and action log

Coding agents and console debugging can reach the store with the [Controller](https://dataclient.io/docs/api/Controller)
methods they already know, without looking up a key first. `__DC__.controller` and `__DC__.actions` read the page's
store; with several stores, set `__DC__.store` to the one to read. Each access looks the store up again, so it keeps
working after a provider remounts. Production builds don't include it.

Logged actions now keep their `args` after their payloads are dropped, so any key in the log can be read back
without importing its endpoint:

```js title="Browser DevTools console"
const c = __DC__.controller;
const a = __DC__.actions.findLast(
  a => a.endpoint && a.key.includes('/todos'),
);
c.getResponse(a.endpoint, ...a.args, c.getState()).data;
```
