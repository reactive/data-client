---
frameworks: [react]
title: DataProvider - React 中的规范化异步数据管理
sidebar_label: <DataProvider />
description: React 中高性能、全局一致的数据管理
---

import Installation from '../shared/\_installation.mdx';
import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# &lt;DataProvider />

管理状态，提供使用各个 hook 所需的全部 context。它应尽可能放在应用树的高处，
因为只有在 React 树中位于该 provider 之下的组件
才能使用这些 hook。

<Installation />

## Props {#props}

```typescript
interface ProviderProps {
  children: ReactNode;
  managers?: Manager[];
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

### managers?: Manager[] {#managers}

要使用的 [Manager](./Manager.md) 列表。这是 provider 最主要的扩展点。

可以使用 [getDefaultManagers()](./getDefaultManagers.md) 来扩展默认的 Manager。

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

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

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
