---
title: DevToolsManager
sidebar_label: DevToolsManager
---

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

```tsx title="index.tsx"
import {
  DevToolsManager,
  DataProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

### skipLogging

`(action: ActionTypes) => boolean`

Can skip some actions to be registered in the browser devtool.

By default will skip inflight [fetch actions](./Controller.md#fetch)

```tsx title="index.tsx"
import {
  DevToolsManager,
  DataProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers =
  process.env.NODE_ENV !== 'production'
    ? [
        // highlight-start
        new DevToolsManager(undefined, () => true),
        // highlight-end
        ...getDefaultManagers().filter(
          manager => manager.constructor.name !== 'DevToolsManager',
        ),
      ]
    : getDefaultManagers();

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

#### Skipping high-frequency updates

When using [WebSockets](../concepts/managers.md#data-stream) or other real-time data sources,
high-frequency updates can overwhelm the DevTools extension. Use the `predicate` option to
filter out specific action types or schemas:

```tsx title="index.tsx"
import { getDefaultManagers, actionTypes } from '@data-client/react';
import { Ticker } from './resources/Ticker';

const managers = getDefaultManagers({
  devToolsManager: {
    // Increase latency buffer for high-frequency updates
    latency: 1000,
    // Skip WebSocket SET actions for Ticker to reduce log spam
    // highlight-start
    predicate: (state, action) =>
      action.type !== actionTypes.SET || action.schema !== Ticker,
    // highlight-end
  },
});
```

## More info

Using this Manager allows in browser [debugging and store inspection](../getting-started/debugging.md).
