---
title: Manager - Powerful middlewares with global store knowledge
sidebar_label: Manager
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import ProviderManagers from '../shared/_provider_managers.mdx';

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

# Manager

`Managers` handle global side effects. They are like :react[[useEffect()](https://react.dev/reference/react/useEffect)]:vue[[watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect)], but for the central data
store.

The default managers run the asynchronous behavior that <abbr title="Reactive Data Client">Data Client</abbr> provides,
such as fetching and subscriptions. Configure them with [getDefaultManagers()](./getDefaultManagers.md), and add your
own `Managers`.

Each Manager implements [middleware](#middleware), which connects it to the store's [control flow](#control-flow).
[init()](#init) and [cleanup()](#cleanup) connect it to the store's lifecycle, for setup and teardown.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## Lifetimes

Each store gets its own Managers. A Manager's code lives at one of three lifetimes:

| Lifetime | Lasts                                                       | Holds                                                      |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Config   | the page                                                    | options passed to the constructor, like a URL or callbacks |
| Store    | one store, from the [managers](#adding) function to unmount | instance fields about the store, like fetches in flight    |
| Active   | [init()](#init) to [cleanup()](#cleanup)                    | timers, connections and listeners                          |

So a constructor only stores its options. :react[React can construct Managers for a store it then discards, so a
constructor must not open anything.]

## Lifecycle

### middleware

`middleware` works like a [redux middleware](https://redux.js.org/advanced/middleware), except that `next()` returns a
`Promise`.

:::react

With &lt;DataProvider /\>, this promise resolves when React
[commits](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
the update. React schedules commits asynchronously, so a Manager can await `next()` to work with the new state after the
DOM updates.

:::

:::vue

This promise resolves when the [DataClientPlugin](./DataClientPlugin.md) store commits the update, so a Manager can
await `next()` to work with the new state.

:::

Redux is synchronous, so Data Client middleware needs an adapter in front of it to receive a promise. Redux middleware
must pass promises through.

Middleware can [read actions](#reading-and-consuming-actions) as they are dispatched, and
[dispatch its own](#dispatching-actions).

### init(state) {#init}

Called when Managers :react[start or resume]:vue[start]. Start timers and connections here.

### cleanup()

Called when Managers :react[pause or stop]:vue[stop]. Stop timers and connections here.

:::react

[DataProvider](./DataProvider.md) calls `init()` and `cleanup()` from an Effect, so they follow the
[Effect lifecycle](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development).
React StrictMode, and [`<Activity>`](https://react.dev/reference/react/Activity) hiding `DataProvider`, pause Managers
with `cleanup()` and resume them with `init()` on the same store.

While Managers are paused, the store keeps applying actions. Fetches in flight still resolve, and `middleware` still sees
them. So:

- Don't reset state about the store in `cleanup()`, like fetches in flight.
- Guard side effects that `cleanup()` stopped, like `this.channel?.postMessage()`.

`init()` gets the store's current state, including on resume.

:::

## Adding managers to Reactive Data Client {#adding}

:::react

Pass a function to the [managers](../api/DataProvider.md#managers) prop of [DataProvider](../api/DataProvider.md). It
runs once for each store, so a remounted `DataProvider` gets new Managers.

:::

:::vue

Pass a function to the [managers](./DataClientPlugin.md#managers) option of [DataClientPlugin](./DataClientPlugin.md).
It runs once for each app.

:::

<ProviderManagers imports={['getDefaultManagers']}>

```ts
import MyManager from './MyManager';

// highlight-next-line
const managers = () => [new MyManager(), ...getDefaultManagers()];
```

</ProviderManagers>

Define the function at module level: it holds only config.

Actions pass through managers in array order. List custom managers before the defaults: [NetworkManager](./NetworkManager.md)
resolves most FETCH actions itself instead of passing them on.

## Control flow

Managers connect to the :react[DataProvider]:vue[DataClientPlugin] store through their lifecycle methods and
middleware. They read and dispatch [actions](./Actions.md), and read the store's state.

<ThemedImage
alt="Manager flux flow"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

The job of `middleware` is to dispatch actions, respond to [actions](./Actions.md), or both.

### Dispatching Actions

[Controller](./Controller.md) provides type-safe action dispatchers.

<TypeScriptEditor>

```ts title="CurrentTime" collapsed
import { Entity } from '@data-client/rest';

export default class CurrentTime extends Entity {
  id = 0;
  time = 0;
}
```

```ts title="TimeManager" framework-imports
import type { Controller, Manager, Middleware } from '@data-client/react';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  declare protected controller: Controller;
  declare protected intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    this.intervalID = setInterval(() => {
      this.controller.set(
        CurrentTime,
        { id: 1 },
        { id: 1, time: Date.now() },
      );
    }, 1000);
  }

  cleanup() {
    clearInterval(this.intervalID);
  }
}
```

</TypeScriptEditor>

### Reading and Consuming Actions

`actionTypes` includes all constants to distinguish between different [actions](./Actions.md).

<TypeScriptEditor>

```ts framework-imports
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
          // wait for state update to be committed
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

</TypeScriptEditor>

Inside each `case`, TypeScript [narrows](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types)
the action's type, so you can access its members safely.

To consume an [action](./Actions.md), don't call `next()`.

<TypeScriptEditor>

```ts title="isEntity" collapsed framework-imports
import type { Schema, EntityInterface } from '@data-client/react';

export default function isEntity(
  schema: Schema,
): schema is EntityInterface {
  return schema !== null && (schema as any).pk !== undefined;
}
```

```ts title="SubsManager" framework-imports
import type {
  Manager,
  Middleware,
  EntityInterface,
} from '@data-client/react';
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

          // consume subscription if we use it
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

</TypeScriptEditor>

`return Promise.resolve();` instead of `next(action)` stops managers listed after this one from seeing the
[action](./Actions.md).

Types: [`FETCH`](./Actions.md#fetch), [`SET`](./Actions.md#set), [`SET_RESPONSE`](./Actions.md#set_response),
[`RESET`](./Actions.md#reset), [`SUBSCRIBE`](./Actions.md#subscribe), [`UNSUBSCRIBE`](./Actions.md#unsubscribe),
[`INVALIDATE`](./Actions.md#invalidate), [`INVALIDATEALL`](./Actions.md#invalidateall), [`EXPIREALL`](./Actions.md#expireall)

## Use cases

Minimal examples for common Manager use cases:

- [Logging](../concepts/managers.md#middleware-logging)
- [Error reporting (monitoring)](../concepts/managers.md#error-reporting)
- [Metrics (fetch timing)](../concepts/managers.md#metrics)
- [Notifications (toasts)](../concepts/managers.md#notifications)
- [Refresh on focus or reconnect](../concepts/managers.md#refresh-on-focus)
- [Cross-tab synchronization](../concepts/managers.md#cross-tab-sync)
- [Offline persistence](../concepts/managers.md#persistence)
- [Data streams (websockets/SSE)](../concepts/managers.md#data-stream)
- [Authentication: logout on 401](./LogoutManager.md)
- [Periodic updates (interval/ticker)](#dispatching-actions)
- [Custom transport subscriptions](#reading-and-consuming-actions)
