---
'@data-client/react': patch
---

Add middlewares argument to prepareStore()

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