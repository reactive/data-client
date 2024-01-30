---
title: Managers and Middleware
sidebar_label: Managers and Middleware
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <title>Centralized side-effect orchestration with React</title>
  <meta name="docsearch:pagerank" content="40"/>
</head>

Reactive Data Client uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, which is
characterized by an easy to [understand and debug](../guides/debugging.md) the store's [undirectional data flow](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>). State updates are performed by a [reducer function](https://github.com/reactive/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19).

<ThemedImage
  alt="Manager flux flow"
  sources={{
    light: useBaseUrl('/img/managers.png'),
    dark: useBaseUrl('/img/managers-dark.png'),
  }}
/>

In flux architectures, it is critical all functions in the flux loop are [pure](https://react.dev/learn/keeping-components-pure).
Managers provide centralized orchestration of side effects. In other words, they are the means to interface
with the world outside RDC.

For instance, [NetworkManager](../api/NetworkManager.md) orchestrates data fetching and [SubscriptionManager](../api/SubscriptionManager.md)
keeps track of which resources are subscribed with [useLive](../api/useLive.md) or [useSubscription](../api/useSubscription.md). By centralizing control, [NetworkManager](../api/NetworkManager.md) automatically deduplicates fetches, and [SubscriptionManager](../api/SubscriptionManager.md)
will keep only actively rendered resources updated.

This makes [Managers](../api/Manager.md) the best way to integrate additional side-effects like metrics and monitoring.
They can also be customized to change core behaviors.


| Default managers                                     | |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | Turns fetch dispatches into network calls                                            |
| [SubscriptionManager](../api/SubscriptionManager.md) | Handles polling [subscriptions](../getting-started/data-dependency.md#subscriptions) |
| [DevToolsManager](../api/DevToolsManager.md)         | Enables [debugging](../guides/debugging.md)                                          |
| Extra managers                                       |
| [LogoutManager](../api/LogoutManager.md)             | Handles HTTP `401` (or other logout conditions)                                      |

## Examples

Reactive Data Client improves type-safety and ergonomics by performing dispatches and store access with
its [Controller](../api/Controller.md)

### Middleware logging

```typescript
import type { Manager, Middleware } from '@data-client/core';

export default class LoggingManager implements Manager {
  getMiddleware = (): Middleware => controller => next => async action => {
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
import type { Manager, Middleware } from '@data-client/core';
import type { EndpointInterface } from '@data-client/endpoint';

export default class StreamManager implements Manager {
  protected declare middleware: Middleware;
  protected declare evtSource: WebSocket | EventSource;
  protected declare endpoints: Record<string, EndpointInterface>;

  constructor(
    evtSource: WebSocket | EventSource,
    endpoints: Record<string, EndpointInterface>,
  ) {
    this.evtSource = evtSource;
    this.endpoints = endpoints;

    // highlight-start
    this.middleware = controller => {
      this.evtSource.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type in this.endpoints)
            controller.setResponse(
              this.endpoints[msg.type],
              ...msg.args,
              msg.data,
            );
        } catch (e) {
          console.error('Failed to handle message');
          console.error(e);
        }
      };
      return next => async action => next(action);
    };
    // highlight-end
  }

  cleanup() {
    this.evtSource.close();
  }

  getMiddleware() {
    return this.middleware;
  }
}
```

[Controller.setResponse()](../api/Controller.md#setResponse) updates the Reactive Data Client store
with `event.data`.

### Coin App

<StackBlitz app="coin-app" file="src/index.tsx,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx,src/resources/StreamManager.ts" height="600" />
