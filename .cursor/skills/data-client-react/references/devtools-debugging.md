# Debugging @data-client/react with Chrome DevTools MCP

Use `user-chrome-devtools` MCP tools to programmatically inspect and interact with the
data-client store in a running browser. Requires dev mode (`NODE_ENV !== 'production'`).

For full [Controller](./Controller.md) API (fetch, set, invalidate, etc.) and
[Action](./Actions.md) types (FETCH, SET, INVALIDATE, etc.), see those references.

## Setup: Inject Action Logger

On first navigation (or reload), inject a logging shim via `initScript` to capture all
dispatched actions before the app boots. This gives you a persistent action log to query.

```js
navigate_page → initScript:

window.__DC_ACTION_LOG__ = [];
const _origDispatch = Object.getOwnPropertyDescriptor(Object.getPrototypeOf({}), 'dispatch');
Object.defineProperty(globalThis, '__DC_INTERCEPT_DISPATCH__', {
  value(action) {
    const entry = {
      type: action.type,
      key: action.meta?.key,
      schema: action.endpoint?.name ?? action.schema?.constructor?.name,
      timestamp: Date.now(),
    };
    if (action.error) entry.error = true;
    globalThis.__DC_ACTION_LOG__.push(entry);
    if (globalThis.__DC_ACTION_LOG__.length > 500)
      globalThis.__DC_ACTION_LOG__ = globalThis.__DC_ACTION_LOG__.slice(-250);
  },
  writable: true, configurable: true,
});
```

Then after the app loads, hook into the controller's dispatch. First discover
the `devtoolsName` key (see "Accessing the Controller"), then use it:

```js
evaluate_script:

() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  if (!ctrl) return 'no controller yet';
  const orig = ctrl._dispatch.bind(ctrl);
  ctrl._dispatch = (action) => {
    globalThis.__DC_INTERCEPT_DISPATCH__?.(action);
    return orig(action);
  };
  return 'dispatch intercepted';
}
```

## Accessing the Controller

`DevToolsManager` registers controllers in `globalThis.__DC_CONTROLLERS__` (a `Map`) keyed by
`devtoolsName` — defaults to `"Data Client: <page title>"`.

**Step 1: Discover available controllers and their keys.**

```js
() => {
  const m = globalThis.__DC_CONTROLLERS__;
  if (!m || m.size === 0) return 'no controllers registered';
  return [...m.keys()];
}
```

**Step 2: Get a controller by its `devtoolsName` key.** Use the key from Step 1.

```js
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  return ctrl ? 'controller found' : 'not found';
}
```

Always use `.get(devtoolsName)` with the actual key from Step 1 — not `.values().next().value`
— so you target the correct store when multiple `DataProvider`s exist.

## Reading State

The store state shape is `{ entities, endpoints, indexes, meta, entitiesMeta, optimistic, lastReset }`.

### Full state overview

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  if (!state) return 'no state';
  return {
    entityTypes: Object.keys(state.entities),
    endpointCount: Object.keys(state.endpoints).length,
    optimisticCount: state.optimistic.length,
    lastReset: state.lastReset,
  };
}
```

### List all entities of a type

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  const entities = state?.entities?.['Todo'];
  if (!entities) return 'no Todo entities';
  return Object.values(entities);
}
```

### Inspect a specific entity by pk

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  return state?.entities?.['Todo']?.['5'];
}
```

### List cached endpoint keys

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  return Object.keys(state?.endpoints ?? {});
}
```

### Get endpoint response (raw, before denormalization)

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  const key = Object.keys(state?.endpoints ?? {}).find(k => k.includes('GET /todos'));
  return key ? { key, data: state.endpoints[key] } : 'not found';
}
```

### Check endpoint metadata (expiry, errors, invalidation)

```js
() => {
  const state = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App')?.getState();
  const key = Object.keys(state?.meta ?? {}).find(k => k.includes('/todos'));
  return key ? { key, ...state.meta[key] } : 'no meta found';
}
```

## Dispatching Actions

Use the [Controller](./Controller.md) to mutate the store. Always look up by `devtoolsName`.
See [Actions](./Actions.md) for the full list of action types dispatched.

### Reset the entire store

```js
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  ctrl?.resetEntireStore();
  return 'store reset';
}
```

### Invalidate all endpoints (force refetch)

```js
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  ctrl?.invalidateAll({ testKey: () => true });
  return 'all invalidated';
}
```

### Invalidate endpoints matching a pattern

```js
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  ctrl?.invalidateAll({ testKey: key => key.includes('/todos') });
  return 'todo endpoints invalidated';
}
```

### Expire endpoints (mark stale, refetch on next use)

```js
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  ctrl?.expireAll({ testKey: key => key.includes('/todos') });
  return 'todo endpoints expired';
}
```

## Reading the Action Log

After injecting the dispatch interceptor (see Setup):

### Recent actions

```js
() => globalThis.__DC_ACTION_LOG__?.slice(-20) ?? 'no log'
```

### Filter by type

```js
() => globalThis.__DC_ACTION_LOG__?.filter(a => a.type === 'rdc/set') ?? []
```

### Filter errors

```js
() => globalThis.__DC_ACTION_LOG__?.filter(a => a.error) ?? []
```

## Correlating with Network Requests

Use `list_network_requests` with `resourceTypes: ["fetch", "xhr"]` to see API calls,
then cross-reference with endpoint keys in state.

## Debugging Checklist

1. **Verify controller exists**: Check `__DC_CONTROLLERS__` map size
2. **Inspect state shape**: Get entity types and endpoint count
3. **Check specific data**: Look up entities by type and pk
4. **Review endpoint metadata**: Check expiry, errors, invalidation status
5. **Track actions**: Read the action log for recent dispatches
6. **Correlate network**: Compare `list_network_requests` with endpoint keys
7. **Force refresh**: Use `invalidateAll` or `expireAll` to trigger refetches
