---
name: data-client-manager
description: Implement @data-client Managers for global/background side effects - websocket, SSE, polling, real-time updates, subscriptions, logging, analytics, metrics/timing, error reporting (Sentry), toast notifications, refetch on window focus or network reconnect, cross-tab sync (BroadcastChannel), offline persistence (localStorage/IndexedDB), auth logout on 401, middleware, intercepting Controller actions, DataProvider managers prop, redux-style action handling. Use when adding cross-cutting store behavior, reacting to dispatched actions, or handling external event streams.
license: Apache 2.0
---

# Guide: Using `@data-client` Managers for global side effects

[Managers](references/managers.md) are singletons that handle global side-effects. Kind of like useEffect() for the central data store.
They interface with the store using [Controller](references/Controller.md), and [redux middleware](https://redux.js.org/tutorials/fundamentals/part-4-store#middleware) is run in response to [actions](references/Actions.md).

## Single Responsibility

One concern per Manager; compose many small managers (e.g. transport, subscriptions, logging, auth) rather than one large one.

## Use cases

Minimal working examples for each use case live in [references/managers.md](references/managers.md) (see the named section) unless another file is linked:

| Use case                                    | Reference                                                                         | Key technique                                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logging actions/state                       | "Middleware logging" in [managers.md](references/managers.md)                     | log around `await next(action)`                                                                                                                                      |
| Error reporting/monitoring (Sentry)         | "Error reporting" in [managers.md](references/managers.md)                        | `SET_RESPONSE` with `action.error`                                                                                                                                   |
| Analytics/metrics (fetch timing)            | "Metrics" in [managers.md](references/managers.md)                                | `FETCH` action's `action.meta.promise`                                                                                                                               |
| Toast notifications on mutations            | "Notifications" in [managers.md](references/managers.md)                          | `SET_RESPONSE` with `action.endpoint.sideEffect`                                                                                                                     |
| Refetch on window focus / network reconnect | "Refresh on focus or reconnect" in [managers.md](references/managers.md)          | `controller.expireAll()` from event listeners in `init()`/`cleanup()`                                                                                                |
| Cross-tab sync                              | "Cross-tab synchronization" in [managers.md](references/managers.md)              | BroadcastChannel + `controller.expireAll()`                                                                                                                          |
| Offline persistence (IndexedDB)             | "Offline persistence" in [managers.md](references/managers.md)                    | debounced IndexedDB write of `controller.getState()` (drop `optimistic` - not cloneable); restore via DataProvider `initialState`. Never use localStorage (blocking) |
| Websocket/SSE push streams                  | "Middleware data stream" in [managers.md](references/managers.md)                 | `controller.set()` on message; connect in `init()`, close in `cleanup()`                                                                                             |
| Polling/interval updates (ticker)           | "Dispatching Actions" in [Manager.md](references/Manager.md); `TimeManager` below | `setInterval` + `controller.set()`                                                                                                                                   |
| Custom transport subscriptions              | "Reading and Consuming Actions" in [Manager.md](references/Manager.md)            | consume `SUBSCRIBE`/`UNSUBSCRIBE` without calling `next`                                                                                                             |
| Auth: logout on 401, reset store on deauth  | [LogoutManager.md](references/LogoutManager.md)                                   | `handleLogout(controller)` + `controller.resetEntireStore()`                                                                                                         |

## References

For detailed API documentation, see the [references](references/) directory:

- [Manager](references/Manager.md) - Manager interface and lifecycle
- [Actions](references/Actions.md) - Action types and payloads
- [Controller](references/Controller.md) - Imperative actions
- [LogoutManager](references/LogoutManager.md) - Handling logout/cleanup
- [getDefaultManagers](references/getDefaultManagers.md) - Default manager configuration
- [managers](references/managers.md) - Managers concept guide

Always use `actionTypes` when comparing action.type. Refer to [Actions](references/Actions.md) for list of actions and their payloads.

## Dispatching actions

[Controller](references/Controller.md) has dispatchers:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set(),
ctrl.setError(), ctrl.resetEntireStore(), ctrl.subscribe(), ctrl.unsubscribe().

```ts
import type { Manager, Middleware } from '@data-client/core';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.intervalID = setInterval(() => {
      controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);

    return next => async action => next(action);
  };

  cleanup() {
    clearInterval(this.intervalID);
  }
}
```

## Reading and Consuming Actions

[Controller](references/Controller.md) has data accessors:
ctrl.getResponse(), ctrl.getState(), ctrl.get(), ctrl.getError(), ctrl.snapshot().

```ts
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE:
        if (action.endpoint.sideEffect) {
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
          // wait for state update to be committed to React
          await next(action);
          // get the data from the store, which may be merged with existing state
          const { data } = controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          );
          console.info(`${action.endpoint.name} ${JSON.stringify(data)}`);
          return;
        }
      // actions must be explicitly passed to next middleware
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

Always use `actionTypes` members to check action.type.
`actionTypes` has: FETCH, SET, SET_RESPONSE, RESET, SUBSCRIBE, UNSUBSCRIBE, INVALIDATE, INVALIDATEALL, EXPIREALL

[actions](references/Actions.md) docs details the action types and their payloads.

## Consuming actions

```ts
import type { Manager, Middleware, EntityInterface } from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  declare protected entities: Record<string, EntityInterface>;

  middleware: Middleware = controller => next => async action => {
    switch (action.type) {
      case actionTypes.SUBSCRIBE:
      case actionTypes.UNSUBSCRIBE:
        const { schema } = action.endpoint;
        // only process registered entities
        if (schema && isEntity(schema) && schema.key in this.entities) {
          if (action.type === actionTypes.SUBSCRIBE) {
            this.subscribe(schema.key, action.args[0]?.product_id);
          } else {
            this.unsubscribe(schema.key, action.args[0]?.product_id);
          }

          // consume subscription to prevent it from being processed by other managers
          return Promise.resolve();
        }
      default:
        return next(action);
    }
  };

  cleanup() {}

  subscribe(channel: string, product_id: string) {}
  unsubscribe(channel: string, product_id: string) {}
}
```

## Usage

```tsx
import { DataProvider, getDefaultManagers } from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = [...getDefaultManagers(), new MyManager()];

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```
