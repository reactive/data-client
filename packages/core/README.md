# [![Reactive Data Client](./data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

[![CircleCI](https://circleci.com/gh/data-client/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/data-client/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/data-client/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/data-client/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dt/@data-client/core.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/core?style=flat-square)](https://bundlephobia.com/result?p=@data-client/core)
[![npm version](https://img.shields.io/npm/v/@data-client/core.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/core)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Reducer/flux normalized, framework-agnostic data store. Includes managers/middleware, global referential equality guarantees,
automatic expiry policies, data normalization. Consumes [TypeScript Standard Endpoints](https://www.npmjs.com/package/@data-client/endpoint)

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs)** &nbsp;|&nbsp; [🏁Getting Started](https://dataclient.io/docs/getting-started/installation) &nbsp;|&nbsp;
[🎮Todo Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/todo-app?file=src%2Fpages%2FHome%2FTodoList.tsx) &nbsp;|&nbsp;
[🎮Github Demo](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Fpages%2FIssueList.tsx)

</div>

### Framework Implementations

- [React](https://www.npmjs.com/package/@data-client/react)
- [React-Redux](https://www.npmjs.com/package/@data-client/redux)

### Sample React Hook suspense implementation

```typescript
function useSuspense(endpoint, ...args)
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.results[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { data, expiryStatus, expiresAt } = useMemo(() => {
    return controller.getResponse(endpoint, ...args, state);
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entityMeta,
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
