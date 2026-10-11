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

`Managers` 是处理全局副作用的单例。有点像中心数据 store 的 :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)]。

默认的 manager 负责编排 <abbr title="Reactive Data Client">Data Client</abbr>
开箱即用提供的复杂异步行为。你可以通过 [getDefaultManagers()](./getDefaultManagers.md) 轻松配置它们，
也可以用自定义的 `Managers` 进行扩展。

Manager 必须实现 [middleware](#middleware)，它把 Manager 接入中心 store 的
[控制流](#control-flow)。此外，[cleanup()](#cleanup) 和 [init()](#init) 会接入
store 的生命周期，用于初始化和清理行为。

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## 生命周期 {#lifecycle}

### middleware {#middleware}

`middleware` 与 [redux middleware](https://redux.js.org/advanced/middleware) 非常相似。
唯一的区别在于 `next()` 函数会返回一个 `Promise`。

:::react

在使用 &lt;DataProvider /\> 时，这个 promise 会在 reducer 的更新被
[提交](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
后 resolve。这是必要的，因为提交阶段是异步调度的。这样就可以构建
在 DOM 更新之后、并基于新计算出的状态执行工作的 manager。

:::

:::vue

这个 promise 会在 reducer 的更新提交到
[DataClientPlugin](./DataClientPlugin.md) store 后 resolve。这样就可以构建基于
新计算出的状态执行工作的 manager。

:::

由于 redux 是完全同步的，必须在 Reactive Data Client 风格的中间件前面放一个适配器，
以确保它们能够消费 promise。反过来，redux 中间件也必须修改为透传 promise。

中间件会[拦截被派发的 action](#reading-and-consuming-actions)，并且还可能[派发自己的 action](#dispatching-actions)。
要进一步了解中间件，请参阅 [redux 文档](https://redux.js.org/advanced/middleware)。

### init(state) {#init}

在 provider 挂载后以初始状态调用。适合在启动时运行
依赖于状态确实存在的初始化逻辑。

### cleanup() {#cleanup}

在 manager 不再使用后，清理所有残留的资源。

## 向 Reactive Data Client 添加 manager {#adding}

:::react

使用 [DataProvider](../api/DataProvider.md) 的 [managers](../api/DataProvider.md#managers) prop。务必
将其提升到 _模块级别_ 或包裹在 _useMemo()_ 中，以确保它们不会被重新创建。Manager
拥有内部状态，因此不要反复重新创建它们，这一点很重要。

:::

:::vue

使用 [DataClientPlugin](./DataClientPlugin.md) 的 [managers](./DataClientPlugin.md#managers) 选项。插件
在每个应用中只安装一次，因此 manager 也只会创建一次。

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = [...getDefaultManagers(), new MyManager()];
```

</ProviderManagers>

## 控制流 {#control-flow}

Manager 通过其生命周期和中间件与 :react[DataProvider]:vue[DataClientPlugin] store 集成。它们通过拦截和派发 [action](./Actions.md)
以及读取内部状态来进行交互，从而编排复杂的控制流。

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
import type { Manager, Middleware } from '@data-client/react';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.intervalID = setInterval(() => {
      controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);

    return next => async action => next(action);
  };

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

在条件块中，action 的[类型会被收窄](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types)，
从而鼓励安全地访问其成员。

如果我们想“处理”某个 [action](./Actions.md)，可以通过不调用 next 来“消费”它。

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

通过 `return Promise.resolve();` 而不是调用 `next(action)`，我们可以阻止排在
这个 manager 之后的 manager 看到该 [action](./Actions.md)。

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
