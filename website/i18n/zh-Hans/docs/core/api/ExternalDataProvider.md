---
frameworks: [react]
title: "<ExternalDataProvider />"
---

import PkgTabs from '@site/src/components/PkgTabs';

将外部 store 与 `Reactive Data Client` 集成。应尽可能放在应用树的高层，
因为只有在 React 树中位于该 provider 之下的组件
才能使用这些 hook。

:::warning

**它是 [&lt;DataProvider /\>](./DataProvider.md) 的替代品——_不要_同时使用两者**

:::

## 安装 {#installation}

## 用法 {#usage}

```tsx title="index.tsx"
import { ExternalDataProvider } from '@data-client/react/redux';
import { createRoot } from 'react-dom/client';

import { store, selector, controller } from './store';
import App from './App';

createRoot(document.body).render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <App />
  </ExternalDataProvider>,
);
```

更完整的示例请参阅 [redux 示例](../guides/redux.md)。

## Props {#props}

### store {#store}

```typescript
interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
}
```

Store 只需符合此接口即可。常见的实现是 [redux store](https://redux.js.org/api/store)，
但理论上任何外部 store 都可以使用。

[进一步了解如何集成 redux。](../guides/redux.md)

### selector {#selector}

```typescript
(state: S) => State<unknown>
```

此函数用于获取 store 状态树中属于 `Reactive Data Client` 的那一部分。

### controller {#controller}

要使用的 [Controller](./Controller.md) 实例。

### devButton {#devbutton}

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

在开发环境中会出现一个小按钮，如果已安装浏览器 devtools，
可以通过它快速打开。此选项用于配置按钮出现的位置；设为 null 则完全禁用。

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null` = `'bottom-right'`

```tsx title="Disable button"
import { ExternalDataProvider } from '@data-client/react/redux';
import { store, selector, controller } from './store';
import App from './App';

<ExternalDataProvider
  store={store}
  selector={selector}
  controller={controller}
  devButton={null}
>
  <App />
</ExternalDataProvider>;
```

```tsx title="Place in top right corner"
import { ExternalDataProvider } from '@data-client/react/redux';
import { store, selector, controller } from './store';
import App from './App';

<ExternalDataProvider
  store={store}
  selector={selector}
  controller={controller}
  devButton="top-right"
>
  <App />
</ExternalDataProvider>;
```