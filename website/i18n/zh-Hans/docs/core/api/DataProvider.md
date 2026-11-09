---
frameworks: [react]
title: DataProvider - React 中的规范化异步数据管理
sidebar_label: <DataProvider />
description: React 中高性能、全局一致的数据管理
---

import Installation from '../shared/\_installation.mdx';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# &lt;DataProvider />

管理状态，提供使用各个 hook 所需的全部 context。它应尽可能放在应用树的高处，
因为只有在 React 树中位于该 provider 之下的组件
才能使用这些 hook。也要把它放在你的 [Suspense 边界](../getting-started/data-dependency.md#boundaries)之上：它的
后备 `<Suspense>`（在开发环境中显示 "Uncaught Suspense"）会先于它上方的任何边界捕获。

最好把它放在 [`<Activity>`](https://react.dev/reference/react/Activity) 之上。把 `<Activity>` 放在 `DataProvider` 之上
也可以，比如 `<Activity>` 隐藏的某个标签页或路由有自己的 `DataProvider`。隐藏它会
[暂停它的 Manager](./Manager.md#cleanup)，因此轮询会停止。它的 store 仍会继续应用响应。

<Installation />

## Props {#props}

```typescript
interface ProviderProps {
  children: ReactNode;
  managers?: () => Manager[];
  initialState?: State<unknown>;
  Controller?: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
  devButton?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | null;
}
```

### initialState: State&lt;unknown\> {#initialState}

<StateType />

你可以提供自己的初始状态，而不是从空缓存开始。这在测试时，
或在服务端渲染中恢复（rehydrate）缓存状态时很有用。

### managers?: () => Manager[] {#managers}

一个返回要使用的 [Manager](./Manager.md) 的函数。这是 provider 最主要的扩展点。

它对每个 store 运行一次，因此每个 `DataProvider` 都有自己的 Manager。请在模块顶层定义它，并用
[getDefaultManagers()](./getDefaultManagers.md) [添加你自己的 Manager](./Manager.md#adding)。

生产环境默认值：

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

开发环境默认值：

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### Controller?: Controller 类 {#Controller}

这让你可以扩展 [Controller](./Controller.md) 来提供更多功能。
如果你有额外的 action 想要分发给自定义的 [Manager](./Manager.md)，这会很有用

```tsx
import { DataProvider, Controller } from '@data-client/react';
import App from './App';

class MyController extends Controller {
  doSomething = () => {
    console.log('hi');
  };
}

const RealApp = (
  <DataProvider Controller={MyController}>
    <App />
  </DataProvider>
);
```

### gcPolicy?: GCInterface {#gcPolicy}

当数据不再被任何组件使用且已过时，就将其从 store 中移除。默认为
`new GCPolicy()`。

```tsx
import { DataProvider, GCPolicy } from '@data-client/react';
import App from './App';

const gcPolicy = new GCPolicy({ intervalMS: 60 * 1000 * 10 });

const RealApp = (
  <DataProvider gcPolicy={gcPolicy}>
    <App />
  </DataProvider>
);
```

<GCPolicyOptions />

### devButton {#devbutton}

<img src={useBaseUrl('/img/client-logo.svg')} style={{float:'right',width:'40px'}} />

在开发环境中会出现一个小按钮，如果已安装[浏览器 DevTools](../getting-started/debugging.md)，
可以通过它快速打开。此选项用于配置按钮显示的位置，设为 null 则完全禁用它。

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null` = `'bottom-right'`

```tsx title="Disable button"
import { DataProvider } from '@data-client/react';
import App from './App';

<DataProvider devButton={null}>
  <App/>
</DataProvider>
```

```tsx title="Place in top right corner"
import { DataProvider } from '@data-client/react';
import App from './App';

<DataProvider devButton="top-right">
  <App/>
</DataProvider>
```
