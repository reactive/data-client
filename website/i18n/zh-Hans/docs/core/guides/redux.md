---
frameworks: [react]
id: redux
title: 用 Reactive Data Client 增强 Redux
sidebar_label: Redux 集成
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Redux 集成

使用 [redux](https://redux.js.org/) 完全是可选的。不过对很多人来说，它意味着可以轻松地与现有项目集成或迁移，
或者只是一个不错的集中式状态管理抽象。

<Tabs
defaultValue="data-client"
values={[
{ label: 'just Reactive Data Client', value: 'data-client' },
{ label: 'with React-Redux', value: 'react-redux' },
]}>
<TabItem value="data-client">

```tsx title="index.tsx"
import {
  ExternalDataProvider,
  prepareStore,
  type Middleware,
} from '@data-client/react/redux';
import { getDefaultManagers, Controller } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const managers = getDefaultManagers();
// be sure to include your other reducers here
const otherReducers = {};
const extraMiddlewares: Middleware[] = [];
// for instance, state serialized from the server
const initialState = {};

const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

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

</TabItem>
<TabItem value="react-redux">

```tsx title="index.tsx"
import {
  ExternalDataProvider,
  prepareStore,
  type Middleware,
} from '@data-client/react/redux';
import { getDefaultManagers, Controller } from '@data-client/react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import App from './App';

const managers = getDefaultManagers();
// be sure to include your other reducers here
const otherReducers = {};
const extraMiddlewares: Middleware[] = [];
// for instance, state serialized from the server
const initialState = {};

const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

createRoot(document.body).render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <Provider store={store}>
      <App />
    </Provider>
  </ExternalDataProvider>,
);
```

</TabItem>
</Tabs>

然后你需要使用 [&lt;ExternalDataProvider /\>](../api/ExternalDataProvider.md) 来代替
[&lt;DataProvider /\>](../api/DataProvider.md)，并传入 store 和一个 selector 函数，用于取出
状态中属于 Reactive Data Client 的部分。

:::info[注意]

你只应使用一个 provider；嵌套另一个 provider 会覆盖之前的那个。

:::

:::info[注意]

由于 `Reactive Data Client` 的 [manager 中间件](../api/Manager.md#middleware)会返回 promise，
所有 redux 中间件都会被放在 [Managers](../concepts/managers.md) 之后。

如果你需要某个中间件在 managers 之前运行，就需要把它包装在一个 [manager](../api/Manager.md) 中。

:::
