---
title: Managers and Middleware
sidebar_label: Managers and Middleware
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

Reactive Data Client uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, which is
characterized by an easy to [understand and debug](../guides/debugging.md) the store's [undirectional data flow](<https://en.wikipedia.org/wiki/Unidirectional_Data_Flow_(computer_science)>). State updates are performed by a [reducer function](https://github.com/data-client/data-client/blob/master/packages/core/src/state/reducer/createReducer.ts#L19).

<ThemedImage
  alt="Manager flux flow"
  sources={{
    light: useBaseUrl('/img/managers.png'),
    dark: useBaseUrl('/img/managers-dark.png'),
  }}
/>

Reactive Data Client improves type-safety and ergonomics by performing dispatches and store access with
its [Controller](../api/Controller.md)

Finally, everything is orchestrated by [Managers](../api/Manager.md). Managers integrate with the flux
lifecycle by intercepting and dispatching actions, as well as reading the internal state.

This central orchestration is how Reactive Data Client is able to coordinate with all components, doing things
like automatic fetch deduplication, polling fetch coordinating eliminating many cases of overfetching.

It also means Reactive Data Client behavior can be arbitrarily customized by writing your own Managers.

| Default managers                                     | |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NetworkManager](../api/NetworkManager.md)           | Turns fetch dispatches into network calls                                            |
| [SubscriptionManager](../api/SubscriptionManager.md) | Handles polling [subscriptions](../getting-started/data-dependency.md#subscriptions) |
| [DevToolsManager](../api/DevToolsManager.md)         | Enables [debugging](../guides/debugging.md)                                          |
| Extra managers                                       |
| [LogoutManager](../api/LogoutManager.md)             | Handles HTTP `401` (or other logout conditions)                                      |

## Examples

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
