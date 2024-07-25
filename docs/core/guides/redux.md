---
id: redux
title: Empowering Redux with Reactive Data Client
sidebar_label: Redux integration
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Redux integration

Using [redux](https://redux.js.org/) is completely optional. However, for many it means easy integration or migration
with existing projects, or just a nice centralized state management abstraction.

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
import ReactDOM from 'react-dom';

const managers = getDefaultManagers();
// be sure to include your other reducers here
const otherReducers = {};
const extraMiddlewares: Middleware = [];

const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

ReactDOM.render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <App />
  </ExternalDataProvider>,
  document.body,
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
import ReactDOM from 'react-dom';

const managers = getDefaultManagers();
// be sure to include your other reducers here
const otherReducers = {};
const extraMiddlewares: Middleware = [];

const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

ReactDOM.render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <Provider store={store}>
      <App />
    </Provider>
  </ExternalDataProvider>,
  document.body,
);
```

</TabItem>
</Tabs>

Then you'll want to use the [&lt;ExternalDataProvider /\>](../api/ExternalDataProvider.md) instead of
[&lt;DataProvider /\>](../api/DataProvider.md) and pass in the store and a selector function to grab
the Reactive Data Client specific part of the state.

:::info Note

You should only use ONE provider; nested another provider will override the previous.

:::

:::info Note

Because `Reactive Data Client` [manager middlewares](../api/Manager.md#middleware) return promises,
all redux middlewares are placed after the [Managers](../concepts/managers.md).

If you need a middlware to run before the managers, you will need to wrap it in a [manager](../api/Manager.md).

:::
