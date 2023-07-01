---
title: Manager
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<head>
  <title>Manager - Powerful middlewares with global store knowledge</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

Managers are singletons that orchestrate the complex asynchronous behavior of `rest-hooks`.
Several managers are provided by `rest-hooks` and used by default; however there is nothing
stopping other compatible managers to be built that expand the functionality. We encourage
PRs or complimentary libraries!

While managers often have complex internal state and methods - the exposed interface is quite simple.
Because of this, it is encouraged to keep any supporting state or methods marked at protected by
typescript. Managers have three exposed pieces - the constructor to build initial state and
take any parameters; a simple cleanup() method to tear down any dangling pieces like setIntervals()
or unresolved Promises; and finally getMiddleware() - providing the mechanism to hook into
the flux data flow.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = <R extends React.Reducer<State<unknown>, ActionTypes>>(
  controller: Controller,
) => (next: Dispatch<R>) => Dispatch<R>;

interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## getMiddleware()

getMiddleware() returns a function that very similar to a [redux middleware](https://redux.js.org/advanced/middleware).
The only differences is that the `next()` function returns a `Promise`. This promise resolves when the reducer update is
[committed](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
when using &lt;CacheProvider /\>. This is necessary since the commit phase is asynchronously scheduled. This enables building
managers that perform work after the DOM is updated and also with the newly computed state.

Since redux is fully synchronous, an adapter must be placed in front of Reactive Data Client style middleware to
ensure they can consume a promise. Conversely, redux middleware must be changed to pass through promises.

Middlewares will intercept actions that are dispatched and then potentially dispatch their own actions as well.
To read more about middlewares, see the [redux documentation](https://redux.js.org/advanced/middleware).

## cleanup()

Provides any cleanup of dangling resources after manager is no longer in use.

## init()

Called with initial state after provider is mounted. Can be useful to run setup at start that
relies on state actually existing.

## Provided managers

- [NetworkManager](../api/NetworkManager.md)
- [SubscriptionManager](../api/SubscriptionManager.md)
- [DevToolsManager](../api/DevToolsManager.md)
- [LogoutManager](../api/LogoutManager.md)

## Adding managers to Reactive Data Client

Use the [managers](../api/CacheProvider.md#managers) prop of [CacheProvider](../api/CacheProvider.md). Be
sure to hoist to module level or wrap in a useMemo() to ensure they are not recreated. Managers
have internal state, so it is important to not constantly recreate them.

<Tabs
defaultValue="18-web"
groupId="platform"
values={[
{ label: 'React Web 16+', value: 'web' },
{ label: 'React Web 18+', value: '18-web' },
{ label: 'React Native', value: 'native' },
{ label: 'NextJS', value: 'nextjs' },
]}>
<TabItem value="web">

```tsx title="/index.tsx"
import { CacheProvider } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

const managers = [...CacheProvider.defaultProps.managers, new MyManager()];

ReactDOM.render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
  document.body,
);
```

</TabItem>

<TabItem value="18-web">

```tsx title="/index.tsx"
import { CacheProvider } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

const managers = [...CacheProvider.defaultProps.managers, new MyManager()];

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import { CacheProvider } from '@rest-hooks/react';
import { AppRegistry } from 'react-native';

const managers = [...CacheProvider.defaultProps.managers, new MyManager()];

const Root = () => (
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

```tsx title="pages/_app.tsx"
import { CacheProvider } from '@rest-hooks/react';
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

const managers = [...CacheProvider.defaultProps.managers, new MyManager()];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider managers={managers}>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

</TabItem>
</Tabs>

## Control flow

Managers live in the CacheProvider centralized store. They orchestrate complex control flows by interfacing
via intercepting and dispatching actions, as well as reading the internal state.

![Manager flux flow](/img/managers.png)

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

[Controller.setResponse()](../api/Controller.md#setResponse) updates the Reactive Data Client store
with `event.data`.
