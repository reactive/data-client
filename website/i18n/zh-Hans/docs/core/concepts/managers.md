---
title: 在 React 中集中编排副作用
vue_title: 在 Vue 中集中编排副作用
sidebar_label: Manager 与 Middleware
description: 以编程方式安全地访问全局 store。实现完全可扩展、可伸缩的副作用。
image: /img/social/managers-card.png
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StackBlitz from '@site/src/components/StackBlitz';
import BatchSetDemo from '../shared/\_BatchSetDemo.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Manager 与 Middleware

<!-- global useEffect - centralized orchestration (talk about the problem we're solving - global side effects) -->

<!-- controller.set -> dispatch(createSet()) -> DevToolsManager -> NetworkManager -> SubManager -> reducer -> state -->

Reactive Data Client 采用 [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) 模式，其
特点是 store 的[单向数据流](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>)易于[理解和调试](../getting-started/debugging.md)。状态更新由 [reducer 函数](https://github.com/reactive/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19)执行。

<ThemedImage
alt="Manager 的 flux 流程"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

在 flux 架构中，flux 循环里的所有函数都必须是 :react[[纯函数](https://react.dev/learn/keeping-components-pure)]:vue[[纯函数](https://en.wikipedia.org/wiki/Pure_function)]，这一点至关重要。
Manager 负责集中编排副作用。换句话说，它们是 <abbr title="Reactive Data Client">Data Client</abbr>
与外部世界交互的途径。

例如，[NetworkManager](../api/NetworkManager.md) 负责编排数据获取，[SubscriptionManager](../api/SubscriptionManager.md)
则跟踪哪些资源通过 [useLive](../api/useLive.md) 或 [useSubscription](../api/useSubscription.md) 被订阅。通过集中控制，[NetworkManager](../api/NetworkManager.md) 会自动对 fetch 去重，而 [SubscriptionManager](../api/SubscriptionManager.md)
只会让正在渲染的资源保持更新。

因此，[Manager](../api/Manager.md) 是集成其他副作用的最佳方式，例如
[日志](#middleware-logging)、[错误上报](#error-reporting)、[指标](#metrics)、
[通知](#notifications)、[数据流](#data-stream)、[聚焦或重连时刷新](#refresh-on-focus)、
[跨标签页同步](#cross-tab-sync)以及[离线持久化](#persistence)。
也可以通过自定义它们来改变核心行为。

| 默认 Manager                                     |                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | 将 fetch dispatch 转换为网络调用                                            |
| [SubscriptionManager](../api/SubscriptionManager.md) | 处理轮询[订阅](../getting-started/data-dependency.md#subscriptions) |
| [DevToolsManager](../api/DevToolsManager.md)         | 支持[调试](../getting-started/debugging.md)                                 |
| 额外的 Manager                                       |
| [LogoutManager](../api/LogoutManager.md)             | 处理 HTTP `401`（或其他登出条件）                                      |

## 示例 {#examples}

Reactive Data Client 通过其 [Controller](../api/Controller.md) 执行 dispatch 和 store 访问，
从而提升类型安全性和易用性

### Middleware 日志 {#middleware-logging}

```typescript framework-imports
import type { Manager, Middleware } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
}
```

### 错误上报 {#error-reporting}

通过检查设置了 `error` 的 [SET_RESPONSE](../api/Actions.md#set_response) action，
将失败的 fetch 上报给 [Sentry](https://sentry.io) 等监控服务。

:::react

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { captureException } from '@sentry/react';

export default class ErrorReportManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.SET_RESPONSE && action.error)
      captureException(action.response, {
        extra: { endpoint: action.endpoint.name, args: action.args },
      });
    return next(action);
  };

  cleanup() {}
}
```

:::

:::vue

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/vue';
import { captureException } from '@sentry/vue';

export default class ErrorReportManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.SET_RESPONSE && action.error)
      captureException(action.response, {
        extra: { endpoint: action.endpoint.name, args: action.args },
      });
    return next(action);
  };

  cleanup() {}
}
```

:::

### 指标 {#metrics}

通过观察 [FETCH](../api/Actions.md#fetch) action 来跟踪 fetch 耗时。`action.meta.promise`
会在 fetch 完成时 resolve。

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { trackTiming } from './analytics';

export default class MetricsManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.FETCH) {
      const start = performance.now();
      action.meta.promise
        .finally(() => {
          trackTiming(action.endpoint.name, performance.now() - start);
        })
        // the fetch's caller handles errors; this only observes timing
        .catch(() => {});
    }
    return next(action);
  };

  cleanup() {}
}
```

### 通知（toast） {#notifications}

在任意[变更](/rest/guides/side-effects)成功或失败时显示 toast。

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { toast } from './toast';

export default class ToastManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (
      action.type === actionTypes.SET_RESPONSE &&
      action.endpoint.sideEffect
    ) {
      if (action.error) toast.error(`${action.endpoint.name} failed`);
      else toast.success(`${action.endpoint.name} succeeded`);
    }
    return next(action);
  };

  cleanup() {}
}
```

### 聚焦或重连时刷新 {#refresh-on-focus}

[Controller.expireAll()](../api/Controller.md#expireAll) 会将数据标记为[过时](../concepts/expiry-policy.md#stale)，
从而在不挂起的情况下触发所有_正在渲染_的数据重新获取（[stale-while-revalidate](./expiry-policy.md)）。
[init()](../api/Manager.md#init) 和 [cleanup()](../api/Manager.md#cleanup) 负责管理事件监听器。

```typescript framework-imports
import type { Manager, Middleware, Controller } from '@data-client/react';

export default class RefreshManager implements Manager {
  declare protected controller: Controller;
  protected handle = () =>
    this.controller.expireAll({ testKey: () => true });

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    window.addEventListener('focus', this.handle);
    window.addEventListener('online', this.handle);
  }

  cleanup() {
    window.removeEventListener('focus', this.handle);
    window.removeEventListener('online', this.handle);
  }
}
```

### 跨标签页同步 {#cross-tab-sync}

当某个标签页中的变更成功时，使用
[BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) 将其他所有标签页中的数据标记为过时。

```typescript framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';

export default class TabSyncManager implements Manager {
  protected channel = new BroadcastChannel('data-client');

  middleware: Middleware = controller => {
    this.channel.onmessage = () =>
      controller.expireAll({ testKey: () => true });
    return next => async action => {
      if (
        action.type === actionTypes.SET_RESPONSE &&
        action.endpoint.sideEffect &&
        !action.error
      )
        this.channel.postMessage('mutation');
      return next(action);
    };
  };

  cleanup() {
    this.channel.close();
  }
}
```

### 离线持久化 {#persistence}

使用 [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 持久化 store
（这里通过 [idb-keyval](https://www.npmjs.com/package/idb-keyval)）；并通过
:react[[DataProvider 的 initialState](../api/DataProvider.md#initialState)]:vue[[DataClientPlugin 的 `initialState` 选项](../api/DataClientPlugin.md#initialState)] 恢复它。IndexedDB 的写入是
异步的，并且使用[结构化克隆](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)，
而不会像 `localStorage` 那样因 JSON 序列化而阻塞主线程。
对写入进行防抖可以让密集的 action 突发保持低开销。恢复时请考虑
[过期时间](./expiry-policy.md)。

```typescript framework-imports
import type { Manager, Middleware } from '@data-client/react';
import { set } from 'idb-keyval';

export default class PersistManager implements Manager {
  declare protected timer?: ReturnType<typeof setTimeout>;

  middleware: Middleware = controller => next => async action => {
    await next(action);
    // debounce: persist at most once per second
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // in-flight optimistic updates reference functions, so are not persistable
      const state = { ...controller.getState(), optimistic: [] };
      set('data-client', state);
    }, 1000);
  };

  cleanup() {
    clearTimeout(this.timer);
  }
}
```

:::react

```tsx title="index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import { get } from 'idb-keyval';
import App from './App';
import PersistManager from './PersistManager';

const managers = [...getDefaultManagers(), new PersistManager()];
const initialState = await get('data-client');

createRoot(document.body).render(
  <DataProvider initialState={initialState} managers={managers}>
    <App />
  </DataProvider>,
);
```

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import { get } from 'idb-keyval';
import App from './App.vue';
import PersistManager from './PersistManager';

const managers = [...getDefaultManagers(), new PersistManager()];
const initialState = await get('data-client');

const app = createApp(App);
app.use(DataClientPlugin, { initialState, managers });
app.mount('#app');
```

:::

### Middleware 数据流（基于推送） {#data-stream}

添加一个 Manager 来处理服务器通过 [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
或 [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) 推送的数据，可以确保
在数据更新与用户操作无关时，我们依然能保持数据新鲜。例如交易应用中的
价格，或实时协作编辑器。

```typescript framework-imports
import type {
  Manager,
  Middleware,
  Controller,
  EntityInterface,
} from '@data-client/react';

export default class StreamManager implements Manager {
  declare protected controller: Controller;
  declare protected evtSource: WebSocket | EventSource;
  declare protected createEventSource: () => WebSocket | EventSource;
  declare protected entities: Record<string, EntityInterface>;

  constructor(
    createEventSource: () => WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.createEventSource = createEventSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  connect() {
    this.evtSource = this.createEventSource();
    // highlight-start
    this.evtSource.onmessage = (event: MessageEvent) => {
      try {
        const msg: { type: string; args: [any]; data: any } = JSON.parse(
          event.data,
        );
        if (msg.type in this.entities)
          this.controller.set(
            this.entities[msg.type],
            ...msg.args,
            msg.data,
          );
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    // highlight-end
  }

  init() {
    this.connect();
  }

  cleanup() {
    this.evtSource?.close();
  }
}
```

[Controller.set()](../api/Controller.md#set) 允许直接使用 `event.data`
更新[可查询 schema](/rest/api/schema#queryable)。

#### 批量处理高频更新 {#batching}

像交易所行情这样的数据流每秒可能发送数百条消息，而且连接建立时通常会先发送一个大型快照。
与其对每条消息都调用 `set()`，不如先将它们缓冲起来，再使用 [Array](/rest/api/Array) schema 按批写入。
[Controller.set([Entity], rows)](../api/Controller.md#set-array) 会在一次 store 更新中规范化所有行。

```typescript
export default class StreamManager implements Manager {
  // ...
  protected buffer: Record<string, any[]> = {};
  declare protected flushTimeout?: ReturnType<typeof setTimeout>;

  connect() {
    this.evtSource = this.createEventSource();
    this.evtSource.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.type in this.entities) {
        (this.buffer[msg.type] ??= []).push(msg.data);
        this.flushTimeout ??= setTimeout(this.flush, 50);
      }
    };
  }

  // highlight-start
  flush = () => {
    const buffer = this.buffer;
    this.buffer = {};
    this.flushTimeout = undefined;
    for (const type in buffer) {
      this.controller.set([this.entities[type]], buffer[type]);
    }
  };
  // highlight-end

  cleanup() {
    this.evtSource?.close();
    clearTimeout(this.flushTimeout);
    this.flushTimeout = undefined;
    this.buffer = {};
  }
}
```

同一批次中 pk 相同的行会按顺序合并，并跳过 [Entity.shouldReorder()](/rest/api/Entity#shouldreorder)，
因此当顺序很重要时，每个 pk 只缓冲最新的一条消息。

:::react

<BatchSetDemo />

:::

#### 为高频更新跳过 DevTools {#skipping-devtools-for-high-frequency-updates}

使用 WebSocket 或其他实时数据源时，你可能希望跳过将
某些高频 action 记录到 [DevToolsManager](../api/DevToolsManager.md)，以免
浏览器扩展不堪重负。

```typescript framework-imports
import { getDefaultManagers, actionTypes } from '@data-client/react';
import StreamManager from './StreamManager';
import { Ticker } from './Ticker';

export default function getManagers() {
  return [
    new StreamManager(() => new WebSocket('wss://ws-feed.example.com'), {
      ticker: Ticker,
    }),
    ...getDefaultManagers({
      devToolsManager: {
        // Increase latency buffer for high-frequency updates
        latency: 1000,
        // Skip WebSocket SET actions to avoid log spam
        // (batched writes use the [Ticker] schema)
        predicate: (state, action) =>
          action.type !== actionTypes.SET ||
          (action.schema !== Ticker && action.schema[0] !== Ticker),
      },
    }),
  ];
}
```

:::react

### 加密货币应用 {#coin-app}

<StackBlitz app="coin-app" file="src/getManagers.ts,src/resources/Ticker.ts,src/pages/AssetDetail/AssetPrice.tsx,src/resources/StreamManager.ts" height="600" />

:::
