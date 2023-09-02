---
title: DevToolsManager
sidebar_label: DevToolsManager
---

```typescript
class DevToolsManager implements Manager
```

Integrates with [Redux DevTools](https://github.com/reduxjs/redux-devtools) to track
state and actions. Note: does not integrate time-travel.

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

For example, we can enable the `trace` option to help track down where actions are dispatched from.

```tsx title="index.tsx"
import {
  DevToolsManager,
  CacheProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers =
  process.env.NODE_ENV !== 'production'
    ? [
        // highlight-start
        new DevToolsManager({
          trace: true,
        }),
        // highlight-end
        ...getDefaultManagers().filter(
          manager => manager.name !== 'DevToolsManager',
        ),
      ]
    : getDefaultManagers();

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

### skipLogging

`(action: ActionTypes) => boolean`

Can skip some actions to be registered in the browser devtool.

By default will skip inflight [fetch actions](./Controller.md#fetch)

```tsx title="index.tsx"
import {
  DevToolsManager,
  CacheProvider,
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
          manager => manager.name !== 'DevToolsManager',
        ),
      ]
    : getDefaultManagers();

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

## More info

Using this Manager allows in browser [debugging and store inspection](../guides/debugging).
