---
title: Manager
id: Manager
original_id: Manager
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

## Provided managers:

- [NetworkManager](./NetworkManager.md)
- [SubscriptionManager](./SubscriptionManager.md)
