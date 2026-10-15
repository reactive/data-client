---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Add recent actions to `globalThis.__DC_ACTIONS__` in development

Coding agents and console debugging can now see what each store dispatched, including the fetches made while the
page loaded, without the Redux DevTools extension. [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager#controllers)
keeps each store's recent actions in a `Map` keyed like `__DC_CONTROLLERS__`. Production builds don't include it.

To keep memory small, only the newest 20 actions keep their payloads, and each polling endpoint keeps only its
last two polls (`maxPollingActions`, default 4 actions).

```js title="Browser DevTools console"
__DC_ACTIONS__.get('Data Client: My App').slice(-10);
```
