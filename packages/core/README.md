<h1>
<div align="center">
<a href="https://dataclient.io" target="_blank" rel="noopener">
  <img alt="Reactive Data Client" src="https://raw.githubusercontent.com/reactive/data-client/master/packages/core/data_client_logo_and_text.svg?sanitize=true">
</a>
</div>
</h1>

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dt/@data-client/core.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/core?style=flat-square)](https://bundlephobia.com/result?p=@data-client/core)
[![npm version](https://img.shields.io/npm/v/@data-client/core.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/core)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The framework-agnostic engine behind Reactive Data Client: a normalized, reducer-based store with
managers (middleware), global referential equality, expiry and invalidation policies, optimistic updates, and garbage collection.
It consumes [TypeScript Standard Endpoints](https://www.npmjs.com/package/@data-client/endpoint)
such as [@data-client/rest](https://www.npmjs.com/package/@data-client/rest) and [@data-client/graphql](https://www.npmjs.com/package/@data-client/graphql).

> **Building an app?** Install [@data-client/react](https://www.npmjs.com/package/@data-client/react) or
> [@data-client/vue](https://www.npmjs.com/package/@data-client/vue) and import everything from there; both re-export what
> apps need from core. This package is for authors of platform and framework integrations. Many package managers won't
> resolve `@data-client/core` for app code unless it is installed directly.

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)

</div>

## How it fits together

Core owns everything about data; an integration only owns _when_ to run it and _how_ the UI hears about changes.

```text
 UI binding ──ctrl.fetch()/set()/...──▶ Controller ──action──▶ Manager middleware ──▶ reducer ──▶ State
     ▲                                                     (NetworkManager, ...)                    │
     └─────── ctrl.getResponseMeta(endpoint, ...args, state) ◀── platform re-renders on change ◀───┘
```

1. **[Controller](https://dataclient.io/docs/api/Controller)** is the one object UI code talks to. Its methods dispatch
   [actions](https://dataclient.io/docs/api/Actions) (`fetch`, `set`, `setResponse`, `invalidate`, ...), and its selectors
   (`getResponseMeta`, `get`, `getError`) denormalize [State](https://dataclient.io/docs/api/types#state) into
   memoized, referentially stable values.
2. **[Managers](https://dataclient.io/docs/api/Manager)** are redux-style middleware with a lifecycle (`init`, `cleanup`).
   [NetworkManager](https://dataclient.io/docs/api/NetworkManager) performs and deduplicates fetches; others add polling,
   websockets, devtools, logout handling, or your own [manager](https://dataclient.io/docs/concepts/managers).
3. **`createReducer(controller)`** turns actions into the next normalized `State`. Pending optimistic updates live in
   `state.optimistic` and are layered on top for rendering.
4. **[GCPolicy](https://dataclient.io/docs/api/DataProvider#gcPolicy)** frees entities no mounted view references.
   Views hold a reference with the `countRef` that `getResponseMeta()` returns. GC deletes in place, so it doesn't
   produce a new `State`.

Because the store is a plain reducer plus middleware, it can live in any state container: React's `useReducer`,
a Vue `shallowRef`, a Redux store, or a plain variable.

## Building an integration

An integration has two halves: a **provider** that owns the store, and **bindings** (hooks, composables, signals, ...)
that read from it.

### Provider: own the store

This is the whole lifecycle, as a framework-free store. `@data-client/vue`'s `DataClientPlugin` does nearly this internally, wrapped
around `shallowRef` and `provide()`.

```ts
function createStore({
  managers = [
    new NetworkManager(),
    new SubscriptionManager(PollingSubscription),
  ],
  initialState: init = initialState,
} = {}) {
  const controller = new Controller({ gcPolicy: new GCPolicy() });
  const reducer = createReducer(controller);
  const listeners = new Set<() => void>();
  let base = init;
  // what views read: committed state plus any pending optimistic updates
  let state = base;

  // the last link in the chain commits to the store
  const commit = async (action: ActionTypes) => {
    const next = reducer(base, action);
    // same reference (no-op actions, and GC, which deletes in place): skip notifying
    if (next === base) return;
    base = next;
    state = base.optimistic.reduce(reducer, base);
    listeners.forEach(listener => listener());
  };
  // redux-style composition; applyManager() binds controller to this api
  const api = {
    getState: () => base,
    dispatch: (action: ActionTypes) => dispatch(action),
  };
  const dispatch: DataClientDispatch = applyManager(
    managers,
    controller,
  ).reduceRight((next, middleware) => middleware(api)(next), commit);

  return {
    controller,
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // call once mounted; returns the cleanup for unmount
    start: initManager(managers, controller, init),
  };
}
```

Requirements every provider must meet:

- **One `Controller`, one set of managers per store**, created once and kept stable. Include `NetworkManager`: it does
  the fetching, and `applyManager()` binds the controller through the first manager, so the list can't be empty. Pass a
  `GCPolicy` to enable garbage collection; the default `ImmortalGCPolicy` keeps everything.
- **Dispatch must go through the whole middleware chain**, including dispatches managers make themselves, which is why
  `api.dispatch` calls the composed chain rather than `commit`. The promise it returns should resolve once the new state is
  visible to readers.
- **The middleware `api.getState()` returns the committed state** (without optimistic updates), since managers and
  `Controller` reason about what the server confirmed. Views read the optimistic overlay (the store's `getState()` here).
- **Run `initManager()` after the store is ready** (on mount), and call its returned cleanup on unmount. It also starts and
  stops the `GCPolicy`.

### Bindings: read the store

Every read is a selector call, plus a fetch when the data is stale. This is `useSuspense()` with the framework taken out:

```ts
function read(store, endpoint, ...args) {
  const { controller } = store;
  const state = store.getState();
  const { data, expiryStatus, expiresAt, countRef } =
    controller.getResponseMeta(endpoint, ...args, state);

  // Invalid data must refetch; otherwise only once it's stale
  const fetching =
    expiryStatus === ExpiryStatus.Invalid || Date.now() > expiresAt ?
      // failures are stored in State, so getError() reports them
      controller.fetch(endpoint, ...args).catch(() => {})
    : undefined;

  // Valid data (even if stale) can render now; anything else waits for `fetching`
  const ready = expiryStatus === ExpiryStatus.Valid || !fetching;
  const error = controller.getError(endpoint, ...args, state);

  return { data, error, ready, fetching, countRef };
}
```

Recompute when the store notifies. Selectors are memoized, so comparing `data` by reference is enough to skip updates.

- NetworkManager deduplicates concurrent fetches of the same key for any binding, except for `sideEffect` endpoints.
- A real binding also memoizes the fetch decision on the key, `expiresAt` and `state.lastReset`, as `useSuspense()`
  does, so re-renders don't dispatch redundant fetches.
- `controller.fetch()` of a `sideEffect` endpoint resolves just before its result is committed, so read results from
  `State` on the next notification rather than right after `await`.
- Call `countRef()` when `data` changes, and call what it returns when the view lets go of that data, so GC keeps its
  entities.
- Selectors treat a single `null` argument (`read(store, endpoint, null)`) as "no request", which lets callers defer
  fetching.

## How React and Vue build on core

Both shipped integrations wire the same core pieces. What they add is the platform's idea of state, lifecycle, and
loading:

| Concern            | Core provides                                | [@data-client/react](https://www.npmjs.com/package/@data-client/react)                                                                                                                                   | [@data-client/vue](https://www.npmjs.com/package/@data-client/vue)                                                    |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Store container    | `createReducer`, `applyManager`              | `useReducer` with middleware, in [`<DataProvider>`](https://dataclient.io/docs/api/DataProvider)                                                                                                         | `shallowRef` and a composed middleware chain, in [`DataClientPlugin`](https://dataclient.io/vue/api/DataClientPlugin) |
| Sharing            | `Controller`                                 | `ControllerContext`, `StateContext`; [`useController()`](https://dataclient.io/docs/api/useController)                                                                                                   | `provide`/`inject` keys; `useController()`, `$dataClient`                                                             |
| Lifecycle          | `initManager`, `GCPolicy`                    | `useEffect` in the provider                                                                                                                                                                              | `provider.start()` on install, `stop()` on `app.unmount`                                                              |
| Reading            | `getResponseMeta`, `get`, `getError`         | Hooks memoized on the state slices they read                                                                                                                                                             | Composables returning `ComputedRef`s; args may be refs or getters                                                     |
| Loading            | `ExpiryStatus`, `expiresAt`                  | [`useSuspense()`](https://dataclient.io/docs/api/useSuspense) throws the fetch promise for Suspense                                                                                                      | `useSuspense()` is async, for `<Suspense>` with async `setup()`                                                       |
| Errors             | `getError`, error policies                   | Thrown to [`<ErrorBoundary>`](https://dataclient.io/docs/api/ErrorBoundary) / [`<AsyncBoundary>`](https://dataclient.io/docs/api/AsyncBoundary)                                                          | Thrown when the returned ref is read                                                                                  |
| Garbage collection | `countRef` from selectors                    | `useEffect(countRef, [data])`                                                                                                                                                                            | `watch` on `data`                                                                                                     |
| Default managers   | `NetworkManager`, `SubscriptionManager`, ... | [`getDefaultManagers()`](https://dataclient.io/docs/api/getDefaultManagers), `IdlingNetworkManager`, devtools button                                                                                     | `getDefaultManagers()`                                                                                                |
| Platform extras    |                                              | SSR and Next.js, React Native, [Redux](https://dataclient.io/docs/guides/redux)                                                                                                                          |                                                                                                                       |
| Testing            | `@data-client/core/mock`                     | [@data-client/test](https://www.npmjs.com/package/@data-client/test): [`MockResolver`](https://dataclient.io/docs/api/MockResolver), [`renderDataHook()`](https://dataclient.io/docs/api/renderDataHook) | `@data-client/vue/test`: `MockPlugin`, `mountDataClient()`                                                            |

A new integration should re-export the same set as react and vue (`Controller`, the managers, `ExpiryStatus`,
`actionTypes`, `GCPolicy` and the types), so app code never imports core.

## Public interface

### Controller

[Controller](https://dataclient.io/docs/api/Controller) is constructed with `{ dispatch?, getState?, memo?, gcPolicy? }`;
`applyManager()` binds `dispatch` and `getState` for you. Subclass it and pass the class to your provider to add
app-wide methods.

- Dispatchers: [fetch](https://dataclient.io/docs/api/Controller#fetch),
  [fetchIfStale](https://dataclient.io/docs/api/Controller#fetchIfStale),
  [expireAll](https://dataclient.io/docs/api/Controller#expireAll),
  [invalidate](https://dataclient.io/docs/api/Controller#invalidate),
  [invalidateAll](https://dataclient.io/docs/api/Controller#invalidateAll),
  [resetEntireStore](https://dataclient.io/docs/api/Controller#resetEntireStore),
  [set](https://dataclient.io/docs/api/Controller#set),
  [setResponse](https://dataclient.io/docs/api/Controller#setResponse),
  [setError](https://dataclient.io/docs/api/Controller#setError),
  [resolve](https://dataclient.io/docs/api/Controller#resolve),
  [subscribe](https://dataclient.io/docs/api/Controller#subscribe),
  [unsubscribe](https://dataclient.io/docs/api/Controller#unsubscribe)
- Selectors (take `state` as the last argument):
  [getResponse](https://dataclient.io/docs/api/Controller#getResponse),
  `getResponseMeta`,
  [getError](https://dataclient.io/docs/api/Controller#getError),
  [get](https://dataclient.io/docs/api/Controller#get),
  `getQueryMeta`
- Other: [getState](https://dataclient.io/docs/api/Controller#getState),
  [snapshot](https://dataclient.io/docs/api/Controller#snapshot) (a [Snapshot](https://dataclient.io/docs/api/Snapshot)
  for `getOptimisticResponse()`), `bindMiddleware`, `memo`, `gcPolicy`

### Store

- `createReducer(controller)`, `initialState`
- `applyManager(managers, controller)`: managers to redux-compatible middleware
- `initManager(managers, controller, initialState)`: returns the mount effect, which returns its cleanup
- [`GCPolicy`](https://dataclient.io/docs/api/DataProvider#gcPolicy), `ImmortalGCPolicy`; types `GCInterface`,
  `GCOptions`, `CreateCountRef`
- `ExpiryStatus` (`Valid`, `InvalidIfStale`, `Invalid`)

### Managers

- [NetworkManager](https://dataclient.io/docs/api/NetworkManager) (required), `ResetError`
- [SubscriptionManager](https://dataclient.io/docs/api/SubscriptionManager) with
  [PollingSubscription](https://dataclient.io/docs/api/PollingSubscription)
- [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager), [LogoutManager](https://dataclient.io/docs/api/LogoutManager)
- `DefaultConnectionListener` (online/offline detection used by polling); type `ConnectionListener`
- Types for writing your own: [`Manager`](https://dataclient.io/docs/api/Manager), `Middleware`, `MiddlewareAPI`, `Dispatch`

### Actions

- [`actionTypes`](https://dataclient.io/docs/api/Actions): `FETCH`, `SET`, `SET_RESPONSE`, `OPTIMISTIC`, `RESET`,
  `SUBSCRIBE`, `UNSUBSCRIBE`, `INVALIDATE`, `INVALIDATEALL`, `EXPIREALL`, `GC`
- `actions`: creators (`createFetch`, `createSet`, `createSetResponse`, ...) for managers that dispatch directly
- Types: `ActionTypes` and each action (`FetchAction`, `SetResponseAction`, ...)

### Types

`State`, `PK`, `DataClientDispatch`, `GenericDispatch`, `EndpointUpdateFunction`, `FetchingMeta`, `DevToolsConfig`,
`EndpointInterface`, `EntityInterface`, `Schema`, `Queryable`, `Denormalize`, `DenormalizeNullable`,
`Normalize`, `ResolveType`, `FetchFunction`, `NetworkError`, `UnknownError`, `ErrorTypes`, and the rest of
[the shared types](https://dataclient.io/docs/api/types) from `@data-client/normalizr`.

### `@data-client/core/mock`

Building blocks for an integration's test utilities: `MockController`, [fixture](https://dataclient.io/docs/api/Fixtures)
types, `createFixtureMap`, `collapseFixture`, [`mockInitialState`](https://dataclient.io/docs/api/mockInitialState).

`__INTERNAL__` exports are used by the first-party packages and may change in any release.
