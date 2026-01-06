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

Reducer/flux normalized, framework-agnostic data store. Includes managers/middleware, global referential equality guarantees,
automatic expiry policies, data normalization. Consumes [TypeScript Standard Endpoints](https://www.npmjs.com/package/@data-client/endpoint)

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx) &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)

</div>

### Framework Implementations

- [React](https://www.npmjs.com/package/@data-client/react)
- [React-Redux](https://dataclient.io/docs/guides/redux)

### Sample React Hook suspense implementation

```typescript
function useSuspense(endpoint, ...args)
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { data, expiryStatus, expiresAt } = useMemo(() => {
    return controller.getResponseMeta(endpoint, ...args, state);
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entitiesMeta,
    meta,
    key,
  ]);

  const error = controller.getError(endpoint, ...args, state);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return controller.fetch(endpoint, ...args);
    // we need to check against serialized params, since params can change frequently
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  // fully "valid" data will not suspend even if it is not fresh
  if (expiryStatus !== ExpiryStatus.Valid && maybePromise) {
    throw maybePromise;
  }

  if (error) throw error;

  return data;
}
```


## API

- [Controller](https://dataclient.io/docs/api/Controller)
  - [ctrl.fetch](https://dataclient.io/docs/api/Controller#fetch)
  - [ctrl.fetchIfStale](https://dataclient.io/docs/api/Controller#fetchIfStale)
  - [ctrl.expireAll](https://dataclient.io/docs/api/Controller#expireAll)
  - [ctrl.invalidate](https://dataclient.io/docs/api/Controller#invalidate)
  - [ctrl.invalidateAll](https://dataclient.io/docs/api/Controller#invalidateAll)
  - [ctrl.resetEntireStore](https://dataclient.io/docs/api/Controller#resetEntireStore)
  - [ctrl.set](https://dataclient.io/docs/api/Controller#set)
  - [ctrl.setResponse](https://dataclient.io/docs/api/Controller#setResponse)
  - [ctrl.setError](https://dataclient.io/docs/api/Controller#setError)
  - [ctrl.resolve](https://dataclient.io/docs/api/Controller#resolve)
  - [ctrl.subscribe](https://dataclient.io/docs/api/Controller#subscribe)
  - [ctrl.unsubscribe](https://dataclient.io/docs/api/Controller#unsubscribe)
  - [ctrl.get](https://dataclient.io/docs/api/Controller#get)
  - [ctrl.getResponse](https://dataclient.io/docs/api/Controller#getResponse)
  - [ctrl.getError](https://dataclient.io/docs/api/Controller#getError)
  - [ctrl.snapshot](https://dataclient.io/docs/api/Controller#snapshot)
  - [ctrl.getState](https://dataclient.io/docs/api/Controller#getState)
- Middleware: [LogoutManager](https://dataclient.io/docs/api/LogoutManager), [NetworkManager](https://dataclient.io/docs/api/NetworkManager), [SubscriptionManager](https://dataclient.io/docs/api/SubscriptionManager), [PollingSubscription](https://dataclient.io/docs/api/PollingSubscription), [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager)
- State: createReducer(), initialState, applyManager