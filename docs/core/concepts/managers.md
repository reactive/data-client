---
title: Centralized side-effect orchestration with React
sidebar_label: Managers and Middleware
description: Safe programmatic access to the global store. Enables fully extensible and scalable side-effects.
image: /img/social/managers-card.png
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Managers and Middleware

<!-- global useEffect - centralized orchestration (talk about the problem we're solving - global side effects) -->

<!-- controller.set -> dispatch(createSet()) -> DevToolsManager -> NetworkManager -> SubManager -> reducer -> state -->

Reactive Data Client uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, which is
characterized by an easy to [understand and debug](../getting-started/debugging.md) the store's [undirectional data flow](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>). State updates are performed by a [reducer function](https://github.com/reactive/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19).

<ThemedImage
alt="Manager flux flow"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

In flux architectures, it is critical all functions in the flux loop are [pure](https://react.dev/learn/keeping-components-pure).
Managers provide centralized orchestration of side effects. In other words, they are the means to interface
with the world outside <abbr title="Reactive Data Client">Data Client</abbr>.

For instance, [NetworkManager](../api/NetworkManager.md) orchestrates data fetching and [SubscriptionManager](../api/SubscriptionManager.md)
keeps track of which resources are subscribed with [useLive](../api/useLive.md) or [useSubscription](../api/useSubscription.md). By centralizing control, [NetworkManager](../api/NetworkManager.md) automatically deduplicates fetches, and [SubscriptionManager](../api/SubscriptionManager.md)
will keep only actively rendered resources updated.

This makes [Managers](../api/Manager.md) the best way to integrate additional side-effects like
[logging](#middleware-logging), [error reporting](#error-reporting), [metrics](#metrics),
[notifications](#notifications), [data streams](#data-stream), [refreshing on focus or reconnect](#refresh-on-focus),
[cross-tab synchronization](#cross-tab-sync), and [offline persistence](#persistence).
They can also be customized to change core behaviors.

| Default managers                                     |                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | Turns fetch dispatches into network calls                                            |
| [SubscriptionManager](../api/SubscriptionManager.md) | Handles polling [subscriptions](../getting-started/data-dependency.md#subscriptions) |
| [DevToolsManager](../api/DevToolsManager.md)         | Enables [debugging](../getting-started/debugging.md)                                 |
| Extra managers                                       |
| [LogoutManager](../api/LogoutManager.md)             | Handles HTTP `401` (or other logout conditions)                                      |

## Examples

Reactive Data Client improves type-safety and ergonomics by performing dispatches and store access with
its [Controller](../api/Controller.md)

### Middleware logging

```typescript
import type { Manager, Middleware } from '@data-client/core';

export default class LoggingManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    console.log('before', action, controller.getState());
    await next(action);
    console.log('after', action, controller.getState());
  };

  cleanup() {}
}
```

### Error reporting {#error-reporting}

Report failed fetches to monitoring services like [Sentry](https://sentry.io) by inspecting
[SET_RESPONSE](../api/Actions.md#set_response) actions with `error` set.

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { captureException } from '@sentry/react';

export default class ErrorReportManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.SET_RESPONSE && action.error)
      captureException(action.response, {
        extra: { endpoint: action.endpoint.name, args: action.args },
      });
    return next(action);
  };

  cleanup() {}
}
```

### Metrics {#metrics}

Track fetch timing by observing [FETCH](../api/Actions.md#fetch) actions. `action.meta.promise`
resolves when the fetch completes.

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { trackTiming } from './analytics';

export default class MetricsManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (action.type === actionTypes.FETCH) {
      const start = performance.now();
      action.meta.promise.finally(() => {
        trackTiming(action.endpoint.name, performance.now() - start);
      });
    }
    return next(action);
  };

  cleanup() {}
}
```

### Notifications (toasts) {#notifications}

Show a toast when any [mutation](/rest/guides/side-effects) succeeds or fails.

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';
import { toast } from './toast';

export default class ToastManager implements Manager {
  middleware: Middleware = controller => next => async action => {
    if (
      action.type === actionTypes.SET_RESPONSE &&
      action.endpoint.sideEffect
    ) {
      if (action.error) toast.error(`${action.endpoint.name} failed`);
      else toast.success(`${action.endpoint.name} succeeded`);
    }
    return next(action);
  };

  cleanup() {}
}
```

### Refresh on focus or reconnect {#refresh-on-focus}

[Controller.expireAll()](../api/Controller.md#expireAll) marks data as [Stale](../concepts/expiry-policy.md#stale),
triggering refetch of any _actively rendered_ data without suspending ([stale-while-revalidate](./expiry-policy.md)).
[init()](../api/Manager.md#init) and [cleanup()](../api/Manager.md#cleanup) manage the event listeners.

```typescript
import type { Manager, Middleware, Controller } from '@data-client/react';

export default class RefreshManager implements Manager {
  declare protected controller: Controller;
  protected handle = () =>
    this.controller.expireAll({ testKey: () => true });

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    window.addEventListener('focus', this.handle);
    window.addEventListener('online', this.handle);
  }

  cleanup() {
    window.removeEventListener('focus', this.handle);
    window.removeEventListener('online', this.handle);
  }
}
```

### Cross-tab synchronization {#cross-tab-sync}

When a mutation succeeds in one tab, mark data stale in all other tabs using
[BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).

```typescript
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';

export default class TabSyncManager implements Manager {
  protected channel = new BroadcastChannel('data-client');

  middleware: Middleware = controller => {
    this.channel.onmessage = () =>
      controller.expireAll({ testKey: () => true });
    return next => async action => {
      if (
        action.type === actionTypes.SET_RESPONSE &&
        action.endpoint.sideEffect &&
        !action.error
      )
        this.channel.postMessage('mutation');
      return next(action);
    };
  };

  cleanup() {
    this.channel.close();
  }
}
```

### Offline persistence {#persistence}

Persist the store with [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
(here via [idb-keyval](https://www.npmjs.com/package/idb-keyval)); restore it with
[DataProvider's initialState](../api/DataProvider.md#initialState). IndexedDB writes are
asynchronous and use [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
instead of blocking the main thread with JSON serialization like `localStorage` would.
Debouncing writes keeps rapid action bursts cheap. Consider [expiry times](./expiry-policy.md)
when restoring.

```typescript
import type { Manager, Middleware } from '@data-client/react';
import { set } from 'idb-keyval';

export default class PersistManager implements Manager {
  declare protected timer?: ReturnType<typeof setTimeout>;

  middleware: Middleware = controller => next => async action => {
    await next(action);
    // debounce: persist at most once per second
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // in-flight optimistic updates reference functions, so are not persistable
      const state = { ...controller.getState(), optimistic: [] };
      set('data-client', state);
    }, 1000);
  };

  cleanup() {
    clearTimeout(this.timer);
  }
}
```

```tsx
import { get } from 'idb-keyval';

const initialState = await get('data-client');

createRoot(document.body).render(
  <DataProvider initialState={initialState} managers={managers}>
    <App />
  </DataProvider>,
);
```

### Middleware data stream (push-based) {#data-stream}

Adding a manager to process data pushed from the server by [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
or [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) ensures
we can maintain fresh data when the data updates are independent of user action. For example, a trading app's
price, or a real-time collaborative editor.

```typescript
import { type Manager, type Middleware, Controller } from '@data-client/react';
import type { Entity } from '@data-client/rest';

export default class StreamManager implements Manager {
  declare protected controller: Controller;
  declare protected evtSource: WebSocket; // | EventSource;
  declare protected createEventSource: () => WebSocket | EventSource;
  declare protected entities: Record<string, typeof Entity>;

  constructor(
    createEventSource: () => WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.createEventSource = createEventSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  }

  connect() {
    this.evtSource = this.createEventSource();
    // highlight-start
    this.evtSource.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type in this.entities)
          controller.set(this.entities[msg.type], ...msg.args, msg.data);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    // highlight-end
  }

  init() {
    this.connect();
  }

  cleanup() {
    this.evtSource?.close();
  }
}
```

[Controller.set()](../api/Controller.md#set) allows directly updating [Querable Schemas](/rest/api/schema#queryable)
directly with `event.data`.

#### Skipping DevTools for high-frequency updates

When using WebSockets or other real-time data sources, you may want to skip logging
certain high-frequency actions to [DevToolsManager](../api/DevToolsManager.md) to avoid
overwhelming the browser extension.

```typescript
import { getDefaultManagers, actionTypes } from '@data-client/react';
import StreamManager from './StreamManager';
import { Ticker } from './Ticker';

export default function getManagers() {
  return [
    new StreamManager(
      () => new WebSocket('wss://ws-feed.example.com'),
      { ticker: Ticker },
    ),
    ...getDefaultManagers({
      devToolsManager: {
        // Increase latency buffer for high-frequency updates
        latency: 1000,
        // Skip WebSocket SET actions to avoid log spam
        predicate: (state, action) =>
          action.type !== actionTypes.SET || action.schema !== Ticker,
      },
    }),
  ];
}
```

### Coin App

<StackBlitz app="coin-app" file="src/getManagers.ts,src/resources/Ticker.ts,src/pages/AssetDetail/AssetPrice.tsx,src/resources/StreamManager.ts" height="600" />
