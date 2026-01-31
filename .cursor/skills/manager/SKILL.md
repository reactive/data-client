---
name: rdc-manager
description: Guidelines for implementing @data-client/react Managers which handle global side effects
---
# Guide: Using `@data-client/react` Managers for global side effects

[Managers](https://dataclient.io/docs/api/Manager) are singletons that handle global side-effects. Kind of like useEffect() for the central data store.
They interface with the store using [Controller](https://dataclient.io/docs/api/Controller), and [redux middleware](https://redux.js.org/tutorials/fundamentals/part-4-store#middleware) is run in response to [actions](https://dataclient.io/docs/api/Actions).

Use @docs/core/api/Manager.md to validate usage.

Always use `actionTypes` when comparing action.type. Refer to @docs/core/api/Actions.md
for list of actions and their payloads.

## Dispatching actions

[Controller](https://dataclient.io/docs/api/Controller) has dispatchers:
ctrl.fetch(), ctrl.fetchIfStale(), ctrl.expireAll(), ctrl.invalidate(), ctrl.invalidateAll(), ctrl.setResponse(), ctrl.set().

```ts
import type { Manager, Middleware } from '@data-client/core';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  protected declare intervalID?: ReturnType<typeof setInterval>;

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

[Controller](https://dataclient.io/docs/api/Controller) has data accessors:
controller.getResponse(), controller.getState(), controller.get(), controller.getError()

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

[actions](https://dataclient.io/docs/api/Actions) docs details the action types and their payloads.

## Consuming actions

```ts
import type { Manager, Middleware, EntityInterface } from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  protected declare entities: Record<string, EntityInterface>;

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
