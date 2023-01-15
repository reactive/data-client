---
title: Managers, Middleware, and Flux
sidebar_label: Managers and Middleware
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

Rest Hooks uses the [flux store](https://facebook.github.io/flux/docs/in-depth-overview/) pattern, which is
characterized by an easy to understand and debug [undirectional data flow](https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)). State updates are performed by a reducer function.

![Manager flux flow](/img/managers.png)

Rest Hooks improves type-safety and ergonomics by performing dispatches and store access with
its [Controller](../api/Controller.md)

Finally, everything is orchestrated by [Managers](../api/Manager.md). Managers integrate with the flux
lifecycle by intercepting and dispatching actions, as well as reading the internal state.

This central orchestration is how Rest Hooks is able to coordinate with all components, doing things
like automatic fetch deduplication, polling fetch coordinating eliminating many cases of overfetching.

It also means Rest Hooks behavior can be arbitrarily customized by writing your own Managers.

## Default managers

- [NetworkManager](../api/NetworkManager.md)
- [SubscriptionManager](../api/SubscriptionManager.md)
- [DevToolsManager](../api/DevToolsManager.md)

## Extra managers

- [LogoutManager](../api/LogoutManager.md)

## Examples

### Middleware logging

```typescript
import type { Manager, Middleware } from '@rest-hooks/core';

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
import type { Manager, Middleware } from '@rest-hooks/core';
import type { EndpointInterface } from '@rest-hooks/endpoint';

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
            controller.setResponse(this.endpoints[msg.type], ...msg.args, msg.data);
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

[Controller.setResponse()](../api/Controller.md#setResponse) updates the Rest Hooks store
with `event.data`.
