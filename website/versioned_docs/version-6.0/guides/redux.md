---
id: redux
title: Redux integration
---
import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Using [redux](https://redux.js.org/) is completely optional. However, for many it means easy integration or migration
with existing projects, or just a nice centralized state management abstraction.

Integration is fairly straightforward as rest-hooks already uses the same paradigms as redux under
the hood. However, care should be taken to integrate the reducer and [middlewares](../api/Manager.md) properly
or it won't work as expected.

First make sure you have redux installed:

<PkgTabs pkgs="redux" />

Note: react-redux is _not_ needed for this integration (though you will need it if you want to use redux directly as well).

Then you'll want to use the [\<ExternalCacheProvider/\>](../api/ExternalCacheProvider.md) instead of
[\<CacheProvider /\>](../api/CacheProvider.md) and pass in the store and a selector function to grab
the rest-hooks specific part of the state.

> Note: You should only use ONE provider; nested another provider will override the previous.

> Note: Rest Hooks manager middlewares return promises, which is different from how redux middlewares work.
> Because of this, if you want to integrate both, you'll need to place all redux middlewares
> after the `PromiseifyMiddleware` adapter, and place all Rest Hooks manager middlewares before.

<Tabs
defaultValue="rest-hooks"
values={[
{ label: 'just Rest Hooks', value: 'rest-hooks' },
{ label: 'with React-Redux', value: 'react-redux' },
]}>
<TabItem value="rest-hooks">

#### `index.tsx`

```tsx
import {
  SubscriptionManager,
  PollingSubscription,
  ExternalCacheProvider,
  PromiseifyMiddleware,
} from 'rest-hooks';
import { initialState, reducer, NetworkManager } from '@rest-hooks/core';
import { createStore, applyMiddleware } from 'redux';
import ReactDOM from 'react-dom';

const networkManager = new NetworkManager();
const subscriptionManager = new SubscriptionManager(PollingSubscription);

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(
    networkManager.getMiddleware(),
    subscriptionManager.getMiddleware(),
    // place Rest Hooks built middlewares before PromiseifyMiddleware
    PromiseifyMiddleware,
    // place redux middlewares after PromiseifyMiddleware
  ),
);
const selector = state => state;

// managers optionally provide initialization subroutine
for (const manager of [networkManager, subscriptionManager]) {
  managers[i].init?.(selector(store.getState()));
}

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
const selector = state => state.restHooks;

const store = createStore(
  // Now we have other reducers
  combineReducers({
    restHooks: restReducer,
    myOtherState: otherReducer,
  }),
  applyMiddleware(
    ...mapMiddleware(selector)(
      manager.getMiddleware(),
      subscriptionManager.getMiddleware(),
    ),
    PromiseifyMiddleware,
  ),
);
// ...
```

</TabItem>
<TabItem value="react-redux">

#### `index.tsx`

```tsx
import {
  SubscriptionManager,
  PollingSubscription,
  ExternalCacheProvider,
  PromiseifyMiddleware,
} from 'rest-hooks';
import { initialState, reducer, NetworkManager } from '@rest-hooks/core';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';

const manager = new NetworkManager();
const subscriptionManager = new SubscriptionManager(PollingSubscription);

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(
    networkManager.getMiddleware(),
    subscriptionManager.getMiddleware(),
    // place Rest Hooks built middlewares before PromiseifyMiddleware
    PromiseifyMiddleware,
    // place redux middlewares after PromiseifyMiddleware
  ),
);
const selector = state => state;

ReactDOM.render(
  <ExternalCacheProvider store={store} selector={selector}>
    <Provider store={store}>
      <App />
    </Provider>
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
const selector = state => state.restHooks;

const store = createStore(
  // Now we have other reducers
  combineReducers({
    restHooks: restReducer,
    myOtherState: otherReducer,
  }),
  applyMiddleware(
    ...mapMiddleware(selector)(
      manager.getMiddleware(),
      subscriptionManager.getMiddleware(),
    ),
    PromiseifyMiddleware,
  ),
);
// ...
```

</TabItem>
</Tabs>

Here we store rest-hooks state information in the 'restHooks' part of the tree.

## Redux devtools

[Redux DevTools](https://github.com/reduxjs/redux-devtools) allows easy inspection of current
state and transitions in the Rest Hooks store.

Simply wrap the return value of `applyMiddleware()` with `composeWithDevTools()`

```typescript
import { composeWithDevTools } from 'redux-devtools-extension';

const store = createStore(
  reducer,
  initialState,
  // The next three lines are added
  composeWithDevTools({
    trace: true,
  })(
    applyMiddleware(
      manager.getMiddleware(),
      subscriptionManager.getMiddleware(),
      // place Rest Hooks built middlewares before PromiseifyMiddleware
      PromiseifyMiddleware,
      // place redux middlewares after PromiseifyMiddleware
    ),
  ),
);
```
