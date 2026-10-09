---
frameworks: [react]
id: redux
title: Potencializando o Redux com o Reactive Data Client
sidebar_label: Integração com Redux
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Integração com Redux

Usar o [redux](https://redux.js.org/) é completamente opcional. No entanto, para muitos isso significa integração ou migração fáceis
com projetos existentes, ou simplesmente uma boa abstração centralizada de gerenciamento de estado.

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

Em seguida, você vai querer usar o [&lt;ExternalDataProvider /\>](../api/ExternalDataProvider.md) em vez do
[&lt;DataProvider /\>](../api/DataProvider.md) e passar o store e uma função selector para obter
a parte do estado específica do Reactive Data Client.

:::info[Note]

Você deve usar apenas UM provider; aninhar outro provider sobrescreverá o anterior.

:::

:::info[Note]

Como os [middlewares dos managers](../api/Manager.md#middleware) do `Reactive Data Client` retornam promises,
todos os middlewares do redux são colocados depois dos [Managers](../concepts/managers.md).

Se você precisar que um middleware rode antes dos managers, será necessário envolvê-lo em um [manager](../api/Manager.md).

:::
