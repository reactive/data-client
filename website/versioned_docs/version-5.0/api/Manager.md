---
title: Manager
---

Managers are singletons that orchestrate the complex asynchronous behavior of `rest-hooks`.
Several managers are provided by `rest-hooks` and used by default; however there is nothing
stopping other compatible managers to be built that expand the functionality. We encourage
PRs or complimentary libraries!

While managers often have complex internal state and methods - the exposed interface is quite simple.
Because of this, it is encouraged to keep any supporting state or methods marked at protected by
typescript. Managers have three exposed pieces - the constructor to build initial state and
take any parameters; a simple cleanup() method to tear down any dangling pieces like setIntervals()
or unresolved Promises; and finally getMiddleware() - providing the mechanism to hook into
the flux data flow.

```typescript
type Dispatch<R extends React.Reducer<any, any>> = (action: React.ReducerAction<R>) => Promise<void>;

type Middleware = <R extends React.Reducer<any, A>, A extends Actions>({
  dispatch,
}: MiddlewareAPI<R>) => (
  next: Dispatch<R>,
) => Dispatch<R>;

interface Manager {
  getMiddleware<T extends Manager>(this: T): Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## getMiddleware()

getMiddleware() returns a function that very similar to a [redux middleware](https://redux.js.org/advanced/middleware).
The only differences is that the `next()` function returns a `Promise`. This promise resolves when the reducer update is
[committed](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
when using <CacheProvider /\>. This is necessary since the commit phase is asynchronously scheduled. This enables building
managers that perform work after the DOM is updated and also with the newly computed state.

Since redux is fully synchronous, an adapter must be placed in front of Rest Hooks style middleware to
ensure they can consume a promise. Conversely, redux middleware must be changed to pass through promises.

Middlewares will intercept actions that are dispatched and then potentially dispatch their own actions as well.
To read more about middlewares, see the [redux documentation](https://redux.js.org/advanced/middleware).

## cleanup()

Provides any cleanup of dangling resources after manager is no longer in use.

## init()

Called with initial state after provider is mounted. Can be useful to run setup at start that
relies on state actually existing.

## Provided managers:

- [NetworkManager](./NetworkManager.md)
- [SubscriptionManager](./SubscriptionManager.md)

## Control flow

Managers live in the CacheProvider centralized store. They orchestrate complex control flows by interfacing
via intercepting and dispatching actions, as well as reading the internal state.

![Manager flux flow](/img/managers.png)

### Middleware logging

```typescript
this.middleware = ({ dispatch, getState }) => (next) => async (action) => {
  console.log('before', action, getState());
  await next(action);
  console.log('after', action, getState())
}
```

### Middleware data stream

```typescript
import type { Manager } from '@rest-hooks/core';
import { createReceive } from '@rest-hooks/core';

export default class StreamManager implements Manager
{
  protected declare middleware: Middleware;
  protected declare websocket: Websocket;

  constructor(url: string) {
    this.websocket = new Websocket(url);

    // highlight-start
    this.middleware = ({ dispatch, getState }) => {
      this.websocket.onmessage = (event) => {
        dispatch(
          createReceive(event.data, { schema: this.Schemas[event.type] })
        );
      }
      return (next) => async (action) => next(action);
    }
    // highlight-end
  }

  cleanup() {
    this.websocket.close();
  }

  getMiddleware<T extends StreamManager>(this: T) {
    return this.middleware;
  }
}
```
