---
id: redux
title: Redux integration
original_id: redux
---

Using [redux](https://redux.js.org/) is completely optional. However, for many it means easy integration or migration
with existing projects, or just a nice centralized state management abstraction.

Integration is fairly straightforward as rest-hooks already uses the same paradigms as redux under
the hood. However, care should be taken to integrate the reducer and [middlewares](../api/Manager.md) properly
or it won't work as expected.

First make sure you have redux installed:

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->

```bash
yarn add redux
```

<!--npm-->

```bash
npm install redux
```

<!--END_DOCUSAURUS_CODE_TABS-->

Note: react-redux is _not_ needed for this integration (though you can use it if you want).

Then you'll want to use the [\<ExternalCacheProvider/\>](../api/ExternalCacheProvider.md) instead of
[\<CacheProvider /\>](../api/CacheProvider.md) and pass in the store and a selector function to grab
the rest-hooks specific part of the state.

> Note: You should only use ONE provider; nested another provider will override the previous.

> Note: Rest Hooks manager middlewares return promises, which is different from how redux middlewares work.
> Because of this, if you want to integrate both, you'll need to place all redux middlewares
> after the `PromiseifyMiddleware` adapter, and place all Rest Hooks manager middlewares before.

#### `index.tsx`

```tsx
import {
  reducer,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  ExternalCacheProvider,
  PromiseifyMiddleware,
} from 'rest-hooks';
import { createStore, applyMiddleware } from 'redux';
import ReactDOM from 'react-dom';

const manager = new NetworkManager();
const subscriptionManager = new SubscriptionManager(PollingSubscription);

const store = createStore(
  reducer,
  applyMiddleware(
    manager.getMiddleware(),
    subscriptionManager.getMiddleware(),
    // place Rest Hooks built middlewares before PromiseifyMiddleware
    PromiseifyMiddleware,
    // place redux middlewares after PromiseifyMiddleware
  ),
);
const selector = state => state;

ReactDOM.render(
  <ExternalCacheProvider store={store} selector={selector}>
    <App />
  </ExternalCacheProvider>,
  document.body,
);
```

Above we have the simplest case where the entire redux store is used for rest-hooks.
However, more commonly you will be integrating with other state. In this case, you
will need to use the `selector` prop of `<ExternalCacheProvider/\>` to specify
where in the state tree the rest-hooks information is.

```typescript
// ...
const store = createStore(
  // Now we have other reducers
  combineReducers({
    restHooks: restReducer,
    myOtherState: otherReducer,
  }),
  applyMiddleware(
    manager.getMiddleware(),
    subscriptionManager.getMiddleware(),
    PromiseifyMiddleware,
  ),
);
const selector = state => state.restHooks;
// ...
```

Here we store rest-hooks state information in the 'restHooks' part of the tree.
