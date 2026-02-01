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

This makes [Managers](../api/Manager.md) the best way to integrate additional side-effects like metrics and monitoring.
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

### Middleware data stream (push-based) {#data-stream}

Adding a manager to process data pushed from the server by [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
or [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) ensures
we can maintain fresh data when the data updates are independent of user action. For example, a trading app's
price, or a real-time collaborative editor.

```typescript
import { type Manager, type Middleware, Controller } from '@data-client/react';
import type { Entity } from '@data-client/rest';

export default class StreamManager implements Manager {
  protected declare evtSource: WebSocket | EventSource;
  protected declare entities: Record<string, typeof Entity>;

  constructor(
    evtSource: WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.evtSource = evtSource;
    this.entities = entities;
  }

  // highlight-start
  middleware: Middleware = controller => {
    this.evtSource.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type in this.endpoints)
          controller.set(this.entities[msg.type], ...msg.args, msg.data);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    return next => async action => next(action);
  };
  // highlight-end

  cleanup() {
    this.evtSource.close();
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
