---
frameworks: [react]
id: redux
title: Potencia Redux con Reactive Data Client
sidebar_label: Integración con Redux
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Integración con Redux

Usar [redux](https://redux.js.org/) es totalmente opcional. Sin embargo, para muchos significa una integración o migración sencilla
con proyectos existentes, o simplemente una buena abstracción centralizada para manejar el estado.

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

Luego querrás usar [&lt;ExternalDataProvider /\>](../api/ExternalDataProvider.md) en lugar de
[&lt;DataProvider /\>](../api/DataProvider.md) y pasarle el store y una función selectora para obtener
la parte del estado específica de Reactive Data Client.

:::info[Note]

Solo debes usar UN provider; anidar otro provider sobrescribirá el anterior.

:::

:::info[Note]

Como los [middlewares de manager](../api/Manager.md#middleware) de `Reactive Data Client` devuelven promesas,
todos los middlewares de redux se colocan después de los [Managers](../concepts/managers.md).

Si necesitas que un middleware se ejecute antes que los managers, tendrás que envolverlo en un [manager](../api/Manager.md).

:::
