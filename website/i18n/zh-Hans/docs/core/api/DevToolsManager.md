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

在开发模式下，`DevToolsManager` 会把页面的 store 放到 `globalThis.__DC__` 上：`__DC__.controller` 是它的
[Controller](/docs/api/Controller)，`__DC__.actions` 是它最近派发的 action，包括页面加载期间派发的 action。无论是否安装了 Redux DevTools 扩展，它都适用于浏览器、React Native 和 Node。

```js title="Browser DevTools console"
__DC__.controller.getState();

// Last 10 actions
__DC__.actions.slice(-10);

// Response for a key in the action log, without importing its endpoint
const c = __DC__.controller;
const a = __DC__.actions.findLast(
  a => a.args && !a.endpoint?.sideEffect && a.key?.includes('/todos'),
);
c.getResponse(a.endpoint, ...a.args, c.getState()).data;

// With several stores, pick one by key
__DC__.stores; // ['Data Client: My App', 'Data Client: My App (2)']
__DC__.store = 'Data Client: My App (2)';
```

这对使用能运行页面 JavaScript 的浏览器工具（例如
Cursor 内置浏览器、[Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp) 或 [Playwright MCP](https://github.com/microsoft/playwright-mcp)）
或 [Expo MCP](https://docs.expo.dev/eas/ai/mcp/) 的 AI 编程助手很有用，它们可以借此以编程方式检查 store
并与之交互。每个 :react[[DataProvider](/docs/api/DataProvider)]:vue[已安装的 [DataClientPlugin](./DataClientPlugin.md)] 都会独立注册，因此
支持同一页面上存在多个 :react[provider]:vue[应用]。当某个名字已被占用时，下一个会注册为
`'Data Client: My App (2)'`，依此类推；设置 `name` 可以为每个 store 指定一个易于辨认的键。在没有 `window` 的环境中（例如
服务端渲染时），store 会改为替换掉同名的上一个 store，因为每个请求的 store 永远不会被清理。

action 日志最多保留 [`maxAge`](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage) 两倍数量的
action（默认 100 个），并像扩展一样跳过相同的重复 fetch。为了减少内存占用，只有
最新的 20 个 action 会保留 `response`；更早的 action 只保留 `type`、`key`、`endpoint`、`meta`、错误
响应以及无副作用 endpoint 的 `args`。当某个 endpoint 在[轮询](/rest/api/RestEndpoint#pollfrequency)时，日志对每个键（endpoint 与参数）只保留最后
`maxPollingActions` 个 action（默认 4 个，即最后两次轮询），这样轮询就不会把其他内容挤出去：

<ProviderManagers imports={['getDefaultManagers']}>

```ts
const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { maxPollingActions: 10 },
});
```

</ProviderManagers>

调用 `cleanup()` 时，Controller 及其日志会被移除。生产构建中不存在以上任何内容。

## 更多信息 {#more-info}

使用这个 Manager 可以在浏览器中进行[调试和 store 检查](../getting-started/debugging.md)。
