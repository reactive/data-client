---
title: getDefaultManagers() - 为 DataProvider 配置 Manager
vue_title: getDefaultManagers() - 为 DataClientPlugin 配置 Manager
sidebar_label: getDefaultManagers
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# getDefaultManagers()

`getDefaultManagers` 返回一个 [Manager](./Manager.md) 数组，用于传给 :react[[&lt;DataProvider />](./DataProvider.md)]:vue[[DataClientPlugin](./DataClientPlugin.md)]。

这样可以轻松地配置和添加自定义 [Manager](./Manager.md)，同时不受默认 Manager
未来可能发生的变化影响。

目前返回 \[[DevToolsManager](./DevToolsManager.md)\*, [NetworkManager](./NetworkManager.md), [SubscriptionManager](./SubscriptionManager.md)\].

\*（生产构建中不包含 `DevToolsManager`。）

## 用法 {#usage}

<ProviderManagers imports={['getDefaultManagers']}>

```ts
// highlight-start
const managers = getDefaultManagers({
  // set fallback expiry time to an hour
  networkManager: { dataExpiryLength: 1000 * 60 * 60 },
});
// highlight-end
```

</ProviderManagers>

:::vue

省略 `managers` 时，`DataClientPlugin` 会使用不带参数的 `getDefaultManagers()`。
其他选项请参阅
[DataClientPlugin](./DataClientPlugin.md#options)。

:::

## 参数 {#arguments}

每个参数表示对应 Manager 的配置，可以是以下三种类型之一：

- 任何普通对象都会作为选项传给该 Manager 的构造函数。
- 直接使用的 Manager 实例。
- `null`。传入时会排除该 Manager。

```ts
getDefaultManagers({
  devToolsManager: { trace: true },
  networkManager: new NetworkManager({ errorExpiryLength: 1 }),
  subscriptionManager: null,
});
```

### networkManager {#networkmanager}

:::note

这里不允许使用 `null`，因为 NetworkManager 是必需的

:::

当 Endpoint 没有定义 [dataExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointdataexpirylength) 时，`dataExpiryLength` 将作为后备值。

当 Endpoint 没有定义 [errorExpiryLength](https://dataclient.io/docs/concepts/expiry-policy#endpointerrorexpirylength) 时，`errorExpiryLength` 将作为后备值。

### devToolsManager {#devtoolsmanager}

传给 redux devtools 的
[参数](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)。

### subscriptionManager {#subscriptionmanager}

实现了 `SubscriptionConstructable` 的类，例如 [PollingSubscription](./PollingSubscription.md)

## 示例 {#examples}

### 追踪 action {#tracing-actions}

例如，我们可以启用 [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) 选项，帮助追踪 action 是从哪里分发的。它对性能影响很大，因此通常是禁用的。

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

### Manager 继承 {#manager-inheritance}

传入 Manager 实例让我们可以通过继承来定制 Manager。

:::react

```ts
import { getDefaultManagers, IdlingNetworkManager } from '@data-client/react';

const managers = getDefaultManagers({
  networkManager: new IdlingNetworkManager(),
});
```

`IdlingNetworkManager` 会把无 [sideEffect](/rest/api/Endpoint#sideeffect)（只读/GET）的请求推迟到动画完成之后，
以防止卡顿。在 Web 端它使用 [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)，在 React Native 中则使用 InteractionManager.runAfterInteractions。

:::

:::vue

```ts
import {
  NetworkManager,
  getDefaultManagers,
  type FetchAction,
} from '@data-client/vue';

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

### 禁用 {#disabling}

使用 `null` 会彻底移除 Manager。[NetworkManager](./NetworkManager.md) 无法通过这种方式移除。

```ts
const managers = getDefaultManagers({
  devToolsManager: null,
  subscriptionManager: null,
});
```

这里我们禁用了除 [NetworkManager](./NetworkManager.md) 之外的所有 Manager。

:::react

### Coin App {#coin-app}

新价格每秒会推送很多次；为了减少 devtool 中的刷屏，我们将其设置为
忽略 `Ticker` 的 [SET](./Controller.md#set) action。

<StackBlitz app="coin-app" file="src/index.tsx,src/resources/StreamManager.ts,src/getManagers.ts" height="580" />

:::
