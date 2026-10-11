---
title: DevToolsManager
sidebar_label: DevToolsManager
---

import ProviderManagers from '../shared/_provider_managers.mdx';

```typescript
class DevToolsManager implements Manager
```

与 [Redux DevTools](https://github.com/reduxjs/redux-devtools) 集成，用于跟踪
状态和 [action](./Actions.md)。注意：不支持时间旅行（time-travel）。

在浏览器中安装 [Chrome 扩展](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
或 [Firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)
即可开始使用。

:::info implements

`DevToolsManager` 实现了 [Manager](./Manager.md)

:::

## constructor(options?, skipLogging?) {#constructoroptions-skiplogging}

### options {#options}

传给 redux devtools 的[参数](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)。

例如，我们可以启用 [trace](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#trace) 选项，帮助追踪 action 是从哪里 dispatch 的。

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});
```

</ProviderManagers>

### skipLogging {#skiplogging}

`(action: ActionTypes) => boolean`

可以跳过某些 action，使其不记录到浏览器 devtool 中。

默认会跳过进行中的 [fetch action](./Controller.md#fetch)

<ProviderManagers imports={['DevToolsManager', 'getDefaultManagers']}>

```ts
// production builds leave out DevToolsManager
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: new DevToolsManager(undefined, () => true),
});
```

</ProviderManagers>

#### 跳过高频更新 {#skipping-high-frequency-updates}

使用 [WebSocket](../concepts/managers.md#data-stream) 或其他实时数据源时，
高频更新可能会让 DevTools 扩展不堪重负。使用 `predicate` 选项
过滤掉特定的 action 类型或 schema：

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

## 以编程方式访问 store {#controllers}

在开发模式下，`DevToolsManager` 会把每个 [Controller](/docs/api/Controller) 注册到
`globalThis.__DC_CONTROLLERS__` 上——这是一个以 devtools 连接名为键的 `Map`。它适用于
浏览器、React Native 和 Node。

```js title="Browser DevTools console"
// List all registered providers
__DC_CONTROLLERS__.keys();

// Get state from the first provider
__DC_CONTROLLERS__.values().next().value.getState();

// Get state by name
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

这对使用 [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)
或 [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) 的 AI 编程助手很有用，它们可以借此以编程方式检查 store
并与之交互。每个 :react[[DataProvider](/docs/api/DataProvider)]:vue[已安装的 [DataClientPlugin](./DataClientPlugin.md)] 都会独立注册，因此
完全支持同一页面上存在多个 :react[provider]:vue[应用]。

调用 `cleanup()` 时，Controller 会从该 map 中移除。

## 更多信息 {#more-info}

使用这个 Manager 可以在浏览器中进行[调试和 store 检查](../getting-started/debugging.md)。
