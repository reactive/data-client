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
type ReduxMiddleware = <R extends React.Reducer<any, A>, A extends Actions>({
  dispatch,
}: MiddlewareAPI<R>) => (
  next: React.Dispatch<React.ReducerAction<R>>,
) => (action: Actions) => void;

interface Manager {
  getMiddleware<T extends Manager>(this: T): ReduxMiddleware;
  cleanup(): void;
}
```

## getMiddleware()

getMiddleware() returns a function that is 100% redux compatible. This enables it to be integrated into redux,
or used by the internal useReducer() enhancer in <CacheProvider />.

Middlewares will intercept actions that are dispatched and then potentially dispatch their own actions as well.
To read more about middlewares, see the [redux documentation](https://redux.js.org/advanced/middleware).

## cleanup()

Provides any cleanup of dangling resources after manager is no longer in use.

## Provided managers:

- [NetworkManager](./NetworkManager.md)
- [SubscriptionManager](./SubscriptionManager.md)
