---
title: Manager - 掌握全局 store 的强大中间件
sidebar_label: Manager
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import ProviderManagers from '../shared/_provider_managers.mdx';

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

# Manager

`Managers` 负责处理全局副作用。它们就像 :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)]，只不过作用于中心数据
store。

默认的 manager 负责运行 <abbr title="Reactive Data Client">Data Client</abbr> 提供的异步行为，
例如获取数据和订阅。你可以通过 [getDefaultManagers()](./getDefaultManagers.md) 配置它们，并添加你
自己的 `Managers`。

每个 Manager 都实现 [middleware](#middleware)，它把 Manager 接入 store 的[控制流](#control-flow)。
[init()](#init) 和 [cleanup()](#cleanup) 把它接入 store 的生命周期，用于初始化和清理。

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## 生存期 {#lifetimes}

每个 store 都有自己的 Manager。Manager 的代码处于以下三种生存期之一：

| 生存期 | 持续时间                                                    | 保存内容                                         |
| ------ | ----------------------------------------------------------- | ------------------------------------------------ |
| Config | 整个页面                                                    | 传给构造函数的选项，比如 URL 或回调               |
| Store  | 一个 store，从 [managers](#adding) 函数运行到卸载            | 关于该 store 的实例字段，比如进行中的获取         |
| Active | 从 [init()](#init) 到 [cleanup()](#cleanup)                 | 定时器、连接和监听器                             |

因此构造函数只保存它的选项。:react[React 可能会为一个随后被丢弃的 store 构造 Manager，所以
构造函数不能打开任何东西。]

## 生命周期 {#lifecycle}

### middleware {#middleware}

`middleware` 的工作方式与 [redux middleware](https://redux.js.org/advanced/middleware) 相同，只是 `next()` 会返回一个
`Promise`。

:::react

在使用 &lt;DataProvider /\> 时，这个 promise 会在 React
[提交](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
更新后 resolve。React 会异步调度提交，因此 Manager 可以 await `next()`，在 DOM 更新之后基于新状态
执行工作。

:::

:::vue

这个 promise 会在 [DataClientPlugin](./DataClientPlugin.md) store 提交更新后 resolve，因此 Manager 可以
await `next()` 来基于新状态执行工作。

:::

:::react

Redux 是同步派发的，因此 redux store 需要在 Manager 之后放一个适配器，让 `next()` 返回 `Promise`。
[prepareStore](../guides/redux.md) 会添加这个适配器，并把 redux 中间件放在它之后。

:::

中间件可以在 action 被派发时[读取它们](#reading-and-consuming-actions)，也可以
[派发自己的 action](#dispatching-actions)。

### init(state) {#init}

在 Manager :react[启动或恢复]:vue[启动]时调用。在这里启动定时器和连接。

### cleanup() {#cleanup}

在 Manager :react[暂停或停止]:vue[停止]时调用。在这里停止定时器和连接。

:::react

[DataProvider](./DataProvider.md) 在 Effect 中调用 `init()` 和 `cleanup()`，因此它们遵循
[Effect 的生命周期](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)。
React StrictMode，以及 [`<Activity>`](https://react.dev/reference/react/Activity) 隐藏 `DataProvider` 时，都会在同一个 store 上
用 `cleanup()` 暂停 Manager，再用 `init()` 恢复它们。

Manager 暂停期间，store 仍会继续应用 action。进行中的获取依然会 resolve，`middleware` 也依然能看到
它们。因此：

- 不要在 `cleanup()` 中重置关于 store 的状态，比如进行中的获取。
- 为 `cleanup()` 已停止的副作用加上防护，比如 `this.channel?.postMessage()`。

`init()` 会拿到 store 的当前状态，恢复时也是如此。

:::

## 向 Reactive Data Client 添加 manager {#adding}

:::react

向 [DataProvider](../api/DataProvider.md) 的 [managers](../api/DataProvider.md#managers) prop 传入一个函数。它
对每个 store 运行一次，因此重新挂载的 `DataProvider` 会得到新的 Manager。

:::

:::vue

向 [DataClientPlugin](./DataClientPlugin.md) 的 [managers](./DataClientPlugin.md#managers) 选项传入一个函数。
它对每个应用运行一次。

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = () => [new MyManager(), ...getDefaultManagers()];
```

</ProviderManagers>

请在模块顶层定义这个函数：它只包含配置。

action 会按数组顺序依次经过各个 manager。请把自定义 manager 放在默认 manager 之前：[NetworkManager](./NetworkManager.md)
会自行处理大多数 FETCH action，而不会把它们继续传递下去。

## 控制流 {#control-flow}

Manager 通过其生命周期方法和中间件接入 :react[DataProvider]:vue[DataClientPlugin] store。
它们读取和派发 [action](./Actions.md)，并读取 store 的状态。

<ThemedImage
alt="Manager 的 flux 流程"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

`middleware` 的职责是派发 action、响应 [action](./Actions.md)，或者两者兼而有之。

### 派发 Action {#dispatching-actions}

[Controller](./Controller.md) 提供了类型安全的 action 派发器。

<TypeScriptEditor>

```ts title="CurrentTime" collapsed
import { Entity } from '@data-client/rest';

export default class CurrentTime extends Entity {
  id = 0;
  time = 0;
}
```

```ts title="TimeManager" framework-imports
import type { Controller, Manager, Middleware } from '@data-client/react';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected controller: Controller;
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    this.intervalID = setInterval(() => {
      this.controller.set(
        CurrentTime,
        { id: 1 },
        { id: 1, time: Date.now() },
      );
    }, 1000);
  }

  cleanup() {
    clearInterval(this.intervalID);
  }
}
```

</TypeScriptEditor>

### 读取和消费 Action {#reading-and-consuming-actions}

`actionTypes` 包含用于区分不同 [action](./Actions.md) 的所有常量。

<TypeScriptEditor>

```ts framework-imports
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE:
        if (action.endpoint.sideEffect) {
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
          // wait for state update to be committed
          await next(action);
          // get the data from the store, which may be merged with existing state
          const { data } = controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          );
          console.info(`${action.endpoint.name} ${JSON.stringify(data)}`);
          return;
        }
      // actions must be explicitly passed to next middleware
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

</TypeScriptEditor>

在每个 `case` 中，TypeScript 会[收窄](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types)
action 的类型，因此你可以安全地访问其成员。

要消费某个 [action](./Actions.md)，不要调用 `next()`。

<TypeScriptEditor>

```ts title="isEntity" collapsed framework-imports
import type { Schema, EntityInterface } from '@data-client/react';

export default function isEntity(
  schema: Schema,
): schema is EntityInterface {
  return schema !== null && (schema as any).pk !== undefined;
}
```

```ts title="SubsManager" framework-imports
import type {
  Manager,
  Middleware,
  EntityInterface,
} from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  declare protected entities: Record<string, EntityInterface>;

  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
      case actionTypes.UNSUBSCRIBE:
        const { schema } = action.endpoint;
        // only process registered entities
        if (schema && isEntity(schema) && schema.key in this.entities) {
          if (action.type === actionTypes.SUBSCRIBE) {
            this.subscribe(schema.key, action.args[0]?.product_id);
          } else {
            this.unsubscribe(schema.key, action.args[0]?.product_id);
          }

          // consume subscription if we use it
          return Promise.resolve();
        }
      default:
        return next(action);
    }
  };

  cleanup() {}

  subscribe(channel: string, product_id: string) {}
  unsubscribe(channel: string, product_id: string) {}
}
```

</TypeScriptEditor>

用 `return Promise.resolve();` 代替 `next(action)`，可以阻止排在这个 manager 之后的 manager 看到该
[action](./Actions.md)。

类型：[`FETCH`](./Actions.md#fetch)、[`SET`](./Actions.md#set)、[`SET_RESPONSE`](./Actions.md#set_response)、
[`RESET`](./Actions.md#reset)、[`SUBSCRIBE`](./Actions.md#subscribe)、[`UNSUBSCRIBE`](./Actions.md#unsubscribe)、
[`INVALIDATE`](./Actions.md#invalidate)、[`INVALIDATEALL`](./Actions.md#invalidateall)、[`EXPIREALL`](./Actions.md#expireall)

## 使用场景 {#use-cases}

常见 Manager 使用场景的最小示例：

- [日志](../concepts/managers.md#middleware-logging)
- [错误上报（监控）](../concepts/managers.md#error-reporting)
- [指标（获取耗时）](../concepts/managers.md#metrics)
- [通知（toast）](../concepts/managers.md#notifications)
- [聚焦或重新联网时刷新](../concepts/managers.md#refresh-on-focus)
- [跨标签页同步](../concepts/managers.md#cross-tab-sync)
- [离线持久化](../concepts/managers.md#persistence)
- [数据流（websockets/SSE）](../concepts/managers.md#data-stream)
- [认证：遇到 401 时登出](./LogoutManager.md)
- [周期性更新（interval/ticker）](#dispatching-actions)
- [自定义传输层订阅](#reading-and-consuming-actions)
