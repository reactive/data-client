---
title: DevToolsManager
sidebar_label: DevToolsManager
---

import ProviderManagers from '../shared/_provider_managers.mdx';

```typescript
class DevToolsManager implements Manager
```

Integrates with [Redux DevTools](https://github.com/reduxjs/redux-devtools) to track
state and [actions](./Actions.md). Note: does not integrate time-travel.

Add the [chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or [firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/) to your
browser to get started.

:::info implements

`DevToolsManager` implements [Manager](./Manager.md)

:::

## constructor(options?, skipLogging?)

### options

[Arguments](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
to send to redux devtools.

For example, we can enable the [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) option to help track down where actions are dispatched from.

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

</ProviderManagers>

### skipLogging

`(action: ActionTypes) => boolean`

Can skip some actions to be registered in the browser devtool.

By default will skip inflight [fetch actions](./Controller.md#fetch)

<ProviderManagers imports={['DevToolsManager', 'getDefaultManagers']}>

```ts
// production builds leave out DevToolsManager
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: new DevToolsManager(undefined, () => true),
});
```

</ProviderManagers>

#### Skipping high-frequency updates

When using [WebSockets](../concepts/managers.md#data-stream) or other real-time data sources,
high-frequency updates can overwhelm the DevTools extension. Use the `predicate` option to
filter out specific action types or schemas:

```ts title="managers.ts" framework-imports
import { getDefaultManagers, actionTypes } from '@data-client/react';
import { Ticker } from './resources/Ticker';

const managers = getDefaultManagers({
  devToolsManager: {
    // Increase latency buffer for high-frequency updates
    latency: 1000,
    // Skip WebSocket SET actions for Ticker to reduce log spam
    // (including batched set([Ticker], rows) writes)
    // highlight-start
    predicate: (state, action) =>
      action.type !== actionTypes.SET ||
      (action.schema !== Ticker && action.schema[0] !== Ticker),
    // highlight-end
  },
});
```

## Programmatic store access {#controllers}

In development mode, `DevToolsManager` registers each [Controller](/docs/api/Controller) on
`globalThis.__DC_CONTROLLERS__`, a `Map` keyed by the devtools connection name. It also records the
most recent dispatched actions for each one on `globalThis.__DC_ACTIONS__`, under the same key. This works
in browsers, React Native, and Node, with or without the Redux DevTools extension.

`globalThis.__DC__` reads one store from both: `__DC__.controller` is its Controller and `__DC__.actions` its
action log. With several stores on the page, set `__DC__.store` to the key of the one to read.

```js title="Browser DevTools console"
// The page's store
__DC__.controller.getState();
__DC__.actions.slice(-10);

// Response for a key in the action log, without importing its endpoint
const c = __DC__.controller;
const a = __DC__.actions.findLast(
  a => a.endpoint && a.key.includes('/todos'),
);
c.getResponse(a.endpoint, ...a.args, c.getState()).data;

// Pick a store when there are several
__DC__.store = 'Data Client: My App (2)';

// List all registered providers
__DC_CONTROLLERS__.keys();

// Get state by name
__DC_CONTROLLERS__.get('Data Client: My App').getState();

// Last 10 actions, including the ones dispatched while the page loaded
__DC_ACTIONS__.get('Data Client: My App').slice(-10);
```

This is useful for AI coding assistants using the [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)
or [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) to programmatically inspect and interact
with the store. Each :react[[DataProvider](/docs/api/DataProvider)]:vue[installed [DataClientPlugin](./DataClientPlugin.md)] registers independently, so
multiple :react[providers]:vue[apps] on the same page are supported. When a name is already taken, the next one
registers as `'Data Client: My App (2)'`, and so on; set `name` to give each a recognizable key. Where there is no `window`, as when
server rendering, a store replaces the previous one with its name instead, since per-request stores are never cleaned up.

The action log keeps up to twice [`maxAge`](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage)
actions (100 by default) and skips the same duplicate fetches the extension does. To keep its memory small, only the
newest 20 actions keep their `response`; older ones keep `type`, `key`, `endpoint`, `meta`, error
responses and the `args` of endpoints without side effects. While an endpoint [polls](/rest/api/RestEndpoint#pollfrequency), the log keeps only its last
`maxPollingActions` actions for each key (endpoint and args) (4 by default, the last two polls), so polling doesn't push everything else out:

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { maxPollingActions: 10 },
});
```

</ProviderManagers>

Controllers and their logs are removed when `cleanup()` is called. None of this exists in production builds.

## More info

Using this Manager allows in browser [debugging and store inspection](../getting-started/debugging.md).
