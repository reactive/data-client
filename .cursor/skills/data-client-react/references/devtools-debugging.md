# Debugging @data-client/react with Chrome DevTools MCP

Debug `@data-client/react` state and actions programmatically via Chrome DevTools MCP `evaluate_script`. The app's `DevToolsManager` exposes the Controller on `globalThis.__DC_CONTROLLERS__` (a `Map` keyed by `devtoolsName`) in dev mode.

## Prerequisites

1. Dev server running with `NODE_ENV !== 'production'`
2. Chrome DevTools MCP connected and page loaded
3. `DevToolsManager` included in `DataProvider` managers (default in dev mode)

## Step 1: Access the Controller

`DevToolsManager` registers controllers in `globalThis.__DC_CONTROLLERS__` keyed by
`devtoolsName` — defaults to `"Data Client: <page title>"`.

### Discover available controllers

```js
// evaluate_script
() => {
  const m = globalThis.__DC_CONTROLLERS__;
  if (!m || m.size === 0) return 'no controllers registered';
  return [...m.keys()];
}
```

### Get a controller by key

Use the key from discovery. Always use `.get(devtoolsName)` with the actual key — not `.values().next().value` — so you target the correct store when multiple `DataProvider`s exist.

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.get('Data Client: My App');
  if (!ctrl) return 'not found';
  return { ok: true, stateKeys: Object.keys(ctrl.getState()) };
}
```

## Step 2: Install the Debug Shim

Run this **once** after the page loads. It wraps dispatch to capture all actions in a circular buffer.

```js
// evaluate_script
(() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  if (!ctrl) return { error: 'No controller found' };

  globalThis.__DC_ACTION_LOG__ = [];
  const MAX_LOG = 200;

  const origDispatch = ctrl._dispatch.bind(ctrl);
  ctrl._dispatch = (action) => {
    const entry = {
      type: action.type,
      key: action.key,
      ts: Date.now(),
    };

    if (action.endpoint) entry.endpoint = action.endpoint.name || action.endpoint.key;
    if (action.args) entry.args = JSON.parse(JSON.stringify(action.args));
    if (action.meta?.date) entry.date = action.meta.date;
    if (action.error) entry.error = true;

    globalThis.__DC_ACTION_LOG__.push(entry);
    if (globalThis.__DC_ACTION_LOG__.length > MAX_LOG) {
      globalThis.__DC_ACTION_LOG__ = globalThis.__DC_ACTION_LOG__.slice(-MAX_LOG / 2);
    }

    return origDispatch(action);
  };

  return { ok: true, stateKeys: Object.keys(ctrl.getState()) };
})()
```

## Step 3: Read State

### High-level queries (denormalized, schema-aware)

Controller provides `getResponse`, `getError`, and `get` that denormalize through schemas — pass `ctrl.getState()` as the last argument.

```js
// evaluate_script — get denormalized response for an endpoint
async () => {
  const mod = await import('/src/resources/Todo.ts');
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  const { data, expiryStatus, expiresAt } = ctrl.getResponse(
    mod.TodoResource.getList,
    {},
    state,
  );
  return { data, expiryStatus, expiresAt };
}
```

```js
// evaluate_script — check if an endpoint has an error
async () => {
  const mod = await import('/src/resources/Todo.ts');
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  const error = ctrl.getError(
    mod.TodoResource.get,
    { id: '5' },
    state,
  );
  return { error: error?.message ?? null };
}
```

```js
// evaluate_script — query a Queryable schema (Entity, Collection, Query)
async () => {
  const mod = await import('/src/resources/Todo.ts');
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  const result = ctrl.get(mod.Todo, { id: '5' }, state);
  return result;
}
```

### Raw normalized state inspection

Use these when you need to see the raw cache structure without denormalization.

```js
// evaluate_script — state overview
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  return {
    entityTypes: Object.keys(state.entities),
    endpointCount: Object.keys(state.endpoints).length,
    metaCount: Object.keys(state.meta).length,
    optimisticCount: state.optimistic.length,
    lastReset: state.lastReset,
  };
}
```

```js
// evaluate_script — inspect specific entity type by key
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const entities = ctrl.getState().entities['Todo'];
  if (!entities) return { error: 'Entity not found' };
  const pks = Object.keys(entities);
  return {
    count: pks.length,
    samplePKs: pks.slice(0, 10),
    sample: pks.length > 0 ? entities[pks[0]] : null,
  };
}
```

```js
// evaluate_script — find endpoint cache entries by path substring
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  const keys = Object.keys(state.endpoints).filter(k => k.includes('/todos'));
  return keys.map(k => ({
    key: k,
    value: state.endpoints[k],
    meta: state.meta[k],
  }));
}
```

### Inspect a specific entity by pk

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  return ctrl.getState().entities?.['Todo']?.['5'];
}
```

### Check endpoint metadata (expiry, errors, invalidation)

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  const state = ctrl.getState();
  const key = Object.keys(state.meta).find(k => k.includes('/todos'));
  return key ? { key, ...state.meta[key] } : 'no meta found';
}
```

## Step 4: Track Actions

After installing the debug shim (Step 2):

### Read recent actions

```js
// evaluate_script
() => globalThis.__DC_ACTION_LOG__?.slice(-20) ?? []
```

### Filter by action type

```js
// evaluate_script — track only fetches
() => (globalThis.__DC_ACTION_LOG__ ?? [])
  .filter(a => a.type === 'rdc/fetch' || a.type === 'rdc/setresponse')
  .slice(-20)
```

### Filter errors

```js
// evaluate_script
() => (globalThis.__DC_ACTION_LOG__ ?? []).filter(a => a.error)
```

### Clear action log

```js
// evaluate_script
() => { globalThis.__DC_ACTION_LOG__ = []; return { cleared: true }; }
```

## Step 5: Mutate State via Controller

Use Controller methods — **never** dispatch raw actions.

### Invalidate an endpoint (force refetch)

```js
// evaluate_script — triggers refetch for subscribed components
async () => {
  const mod = await import('/src/resources/Todo.ts');
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  await ctrl.invalidate(mod.TodoResource.get, { id: '5' });
  return { invalidated: true };
}
```

### Invalidate endpoints matching a pattern

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  ctrl.invalidateAll({ testKey: key => key.includes('/todos') });
  return 'todo endpoints invalidated';
}
```

### Expire endpoints (mark stale, refetch on next use)

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  ctrl.expireAll({ testKey: key => key.includes('/todos') });
  return 'todo endpoints expired';
}
```

### Set a value directly

```js
// evaluate_script — use setResponse to inject mock data
async () => {
  const mod = await import('/src/resources/Todo.ts');
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  await ctrl.setResponse(
    mod.TodoResource.getList,
    {},
    [{ id: 1, title: 'Mock Todo', completed: false }],
  );
  return { set: true };
}
```

### Reset entire store

```js
// evaluate_script
() => {
  const ctrl = globalThis.__DC_CONTROLLERS__?.values().next().value;
  ctrl.resetEntireStore();
  return { reset: true };
}
```

## Correlating with Network Requests

Use `list_network_requests` with `resourceTypes: ["fetch", "xhr"]` to see API calls,
then cross-reference with endpoint keys in state.

## Action Types Reference

| Type | Controller Method | Description |
|---|---|---|
| `rdc/fetch` | `fetch()` | Network request initiated |
| `rdc/setresponse` | `setResponse()` | Response written to cache |
| `rdc/set` | `set()` | Direct entity value set |
| `rdc/optimistic` | (automatic) | Optimistic update applied |
| `rdc/invalidate` | `invalidate()` | Single endpoint invalidated |
| `rdc/invalidateall` | `invalidateAll()` | Bulk invalidation by key test |
| `rdc/expireall` | `expireAll()` | Bulk mark-stale by key test |
| `rdc/reset` | `resetEntireStore()` | Full store reset |
| `rdc/subscribe` | `subscribe()` | Subscription registered |
| `rdc/unsubscribe` | `unsubscribe()` | Subscription removed |
| `rdc/gc` | (automatic) | Garbage collection |

## Controller State Readers

All take `state` (from `ctrl.getState()`) as the **last** argument.

| Method | Signature | Returns |
|---|---|---|
| `getResponse` | `(endpoint, ...args, state)` | `{ data, expiryStatus, expiresAt }` — denormalized through schema |
| `getError` | `(endpoint, ...args, state)` | `ErrorTypes \| undefined` |
| `get` | `(schema, ...args, state)` | `Denormalized \| undefined` for any Queryable schema |
| `getQueryMeta` | `(schema, ...args, state)` | `{ data, countRef }` |

`expiryStatus` values: `1` = Invalid, `2` = InvalidIfStale, `3` = Valid.

## State Shape Reference

```ts
State = {
  entities: { [entityKey: string]: { [pk: string]: EntityInstance } },
  endpoints: { [cacheKey: string]: PK | PK[] | unknown },
  indexes: { [entityKey: string]: { [indexName: string]: { [lookupValue: string]: PK } } },
  meta: {
    [key: string]: {
      date, fetchedAt, expiresAt,
      prevExpiresAt?, error?, invalidated?, errorPolicy?: 'hard' | 'soft'
    }
  },
  entitiesMeta: { [entityKey: string]: { [pk: string]: { date, expiresAt, fetchedAt } } },
  optimistic: (SetResponseAction | OptimisticAction)[],
  lastReset: number,
}
```

## Polling Pattern

For monitoring ongoing activity, poll with short intervals:

1. Install shim (Step 2)
2. Trigger the user action or navigation
3. Wait 2–3 seconds
4. Read actions (Step 4) — check for `rdc/fetch` then `rdc/setresponse` pairs
5. If needed, read entity state (Step 3) to verify cache contents
6. Repeat if watching for subscription updates

## Debugging Checklist

1. **Verify controller exists**: Check `__DC_CONTROLLERS__` map size
2. **Inspect state shape**: Get entity types and endpoint count
3. **Check specific data**: Look up entities by type and pk
4. **Review endpoint metadata**: Check expiry, errors, invalidation status
5. **Track actions**: Read the action log for recent dispatches
6. **Correlate network**: Compare `list_network_requests` with endpoint keys
7. **Force refresh**: Use `invalidateAll` or `expireAll` to trigger refetches
