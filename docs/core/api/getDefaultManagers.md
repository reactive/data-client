---
title: getDefaultManagers() - Configuring managers for DataProvider
vue_title: getDefaultManagers() - Configuring managers for DataClientPlugin
sidebar_label: getDefaultManagers
---

import StackBlitz from '@site/src/components/StackBlitz';

# getDefaultManagers()

`getDefaultManagers` returns an Array of [Managers](./Manager.md) to be sent to :react[[&lt;DataProvider />](./DataProvider.md)]:vue[[DataClientPlugin](../getting-started/installation.md#add-provider-at-top-level-component)].

This makes it simple to configure and add custom [Managers](./Manager.md), while remaining robust against
any potential changes to the default managers.

Currently returns \[[DevToolsManager](./DevToolsManager.md)\*, [NetworkManager](./NetworkManager.md), [SubscriptionManager](./SubscriptionManager.md)\].

\*(`DevToolsManager` is excluded in production builds.)

## Usage

:::react

```tsx
import {
  DevToolsManager,
  DataProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

// highlight-start
const managers = getDefaultManagers({
  // set fallback expiry time to an hour
  networkManager: { dataExpiryLength: 1000 * 60 * 60 },
});
// highlight-end

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

See [DataProvider](./DataProvider.md) for details on usage in different environments.

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import App from './App.vue';

// highlight-start
const managers = getDefaultManagers({
  // set fallback expiry time to an hour
  networkManager: { dataExpiryLength: 1000 * 60 * 60 },
});
// highlight-end

const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');
```

When `managers` is omitted, `DataClientPlugin` uses `getDefaultManagers()` with no arguments.
See [installation](../getting-started/installation.md#add-provider-at-top-level-component) for the
other `DataClientPlugin` options.

:::

## Arguments

Each argument represents a configuration of the manager. It can be of three possible types:

- Any plain object is used as options to be sent to the manager's constructor.
- An instance of the manager to be used directly.
- `null`. When sent will exclude the manager.

```ts
getDefaultManagers({
  devToolsManager: { trace: true },
  networkManager: new NetworkManager({ errorExpiryLength: 1 }),
  subscriptionManager: null,
});
```

### networkManager

:::note

`null` is not allowed here since NetworkManager is required

:::

`dataExpiryLength` is used as a fallback when an Endpoint does not have [dataExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointdataexpirylength) defined.

`errorExpiryLength` is used as a fallback when an Endpoint does not have [errorExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointerrorexpirylength) defined.

### devToolsManager

[Arguments](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)
to send to redux devtools.

### subscriptionManager

A class that implements `SubscriptionConstructable` like [PollingSubscription](./PollingSubscription.md)

## Examples

### Tracing actions

For example, we can enable the [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) option to help track down where actions are dispatched from. This has a large performance impact, so it is normally disabled.

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

### Manager inheritance

Sending manager instances allows us to customize managers using inheritance.

:::react

```ts
import { IdlingNetworkManager } from '@data-client/react';

const managers = getDefaultManagers({
  networkManager: new IdlingNetworkManager(),
});
```

`IdlingNetworkManager` can prevent stuttering by delaying [sideEffect](/rest/api/Endpoint#sideeffect)-free (read-only/GET) fetches
until animations are complete. This works in web using [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback), and react native using InteractionManager.runAfterInteractions.

:::

:::vue

```ts
import { NetworkManager, type FetchAction } from '@data-client/vue';

class LoggingNetworkManager extends NetworkManager {
  protected handleFetch(action: FetchAction) {
    console.log('fetching', action.key);
    return super.handleFetch(action);
  }
}

const managers = getDefaultManagers({
  networkManager: new LoggingNetworkManager(),
});
```

:::

### Disabling

Using `null` will remove managers completely. [NetworkManager](./NetworkManager.md) cannot be removed this way.

```ts
const managers = getDefaultManagers({
  devToolsManager: null,
  subscriptionManager: null,
});
```

Here we disable every manager except [NetworkManager](./NetworkManager.md).

:::react

### Coin App

New prices are streamed in many times a second; to reduce devtool spam, we set it
to ignore [SET](./Controller.md#set) actions for `Ticker`.

<StackBlitz app="coin-app" file="src/index.tsx,src/resources/StreamManager.ts,src/getManagers.ts" height="580" />

:::
