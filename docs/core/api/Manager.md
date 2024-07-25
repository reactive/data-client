---
title: Manager - Powerful middlewares with global store knowledge
sidebar_label: Manager
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

# Manager

`Managers` are singletons that handle global side-effects. Kind of like `useEffect()` for the central data
store.

The default managers orchestrate the complex asynchronous behavior that <abbr title="Reactive Data Client">Data Client</abbr>
provides out of the box. These can easily be configured with [getDefaultManagers()](./getDefaultManagers.md), and
extended with your own custom `Managers`.

Managers must implement [middleware](#middleware), which hooks them into the central store's
[control flow](#control-flow). Additionally, [cleanup()](#cleanup) and [init()](#init) hook into the
store's lifecycle for setup/teardown behaviors.

```typescript
type Dispatch = (action: ActionTypes) => Promise<void>;

type Middleware = (controller: Controller) => (next: Dispatch) => Dispatch;

interface Manager {
  middleware: Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
```

## Lifecycle

### middleware

`middleware` is very similar to a [redux middleware](https://redux.js.org/advanced/middleware).
The only differences is that the `next()` function returns a `Promise`. This promise resolves when the reducer update is
[committed](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm)
when using &lt;DataProvider /\>. This is necessary since the commit phase is asynchronously scheduled. This enables building
managers that perform work after the DOM is updated and also with the newly computed state.

Since redux is fully synchronous, an adapter must be placed in front of Reactive Data Client style middleware to
ensure they can consume a promise. Conversely, redux middleware must be changed to pass through promises.

Middlewares will intercept actions that are dispatched and then potentially dispatch their own actions as well.
To read more about middlewares, see the [redux documentation](https://redux.js.org/advanced/middleware).

### cleanup()

Provides any cleanup of dangling resources after manager is no longer in use.

### init()

Called with initial state after provider is mounted. Can be useful to run setup at start that
relies on state actually existing.

## Adding managers to Reactive Data Client {#adding}

Use the [managers](../api/DataProvider.md#managers) prop of [DataProvider](../api/DataProvider.md). Be
sure to hoist to _module level_ or wrap in a _useMemo()_ to ensure they are not recreated. Managers
have internal state, so it is important to not constantly recreate them.

<Tabs
defaultValue="web"
groupId="platform"
values={[
{ label: 'Web', value: 'web' },
{ label: 'React Native', value: 'native' },
{ label: 'NextJS', value: 'nextjs' },
{ label: 'Expo', value: 'expo' },
]}>

<TabItem value="web">

```tsx title="/index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = [...getDefaultManagers(), new MyManager()];

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { AppRegistry } from 'react-native';

const managers = [...getDefaultManagers(), new MyManager()];

const Root = () => (
  <DataProvider managers={managers}>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

// highlight-next-line
const managers = [...getDefaultManagers(), new MyManager()];

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

```tsx title="app/_layout.tsx"
import Provider from './Provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

</TabItem>
<TabItem value="expo">

```tsx title="app/Provider.tsx"
import { getDefaultManagers, DataProvider } from '@data-client/react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';

// highlight-next-line
const managers = [...getDefaultManagers(), new MyManager()];

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      // highlight-next-line
      <DataProvider managers={managers}>{children}</DataProvider>
    </ThemeProvider>
  );
}
```

```tsx title="app/_layout.tsx"
import { Stack } from 'expo-router';
import 'react-native-reanimated';

// highlight-next-line
import Provider from './Provider';

export default function RootLayout() {
  return (
    // highlight-start
    <Provider>
      // highlight-end
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      // highlight-start
    </Provider>
    // highlight-end
  );
}
```

</TabItem>
</Tabs>

## Control flow

Managers integrate with the DataProvider store with their lifecycles and middleware. They orchestrate complex control
flows by interfacing via intercepting and dispatching actions, as well as reading the internal state.

<ThemedImage
alt="Manager flux flow"
sources={{
    light: useBaseUrl('/img/flux-full.png'),
    dark: useBaseUrl('/img/flux-full-dark.png'),
  }}
/>

The job of `middleware` is to dispatch actions, respond to actions, or both.

### Dispatching Actions

[Controller](./Controller.md) provides type-safe action dispatchers.

<TypeScriptEditor>

```ts title="CurrentTime" collapsed
import { Entity } from '@data-client/endpoint';

export default class CurrentTime extends Entity {
  id = 0;
  time = 0;
  pk() {
    return this.id;
  }
}
```

```ts title="TimeManager"
import type { Manager, Middleware } from '@data-client/core';
import CurrentTime from './CurrentTime';

export default class TimeManager implements Manager {
  protected declare intervalID?: ReturnType<typeof setInterval>;

  middleware: Middleware => controller => {
    this.intervalID = setInterval(() => {
      controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);

    return next => async action => next(action);
  };

  cleanup() {
    clearInterval(this.intervalID);
  }
}
```

</TypeScriptEditor>

### Reading and Consuming Actions

`actionTypes` includes all constants to distinguish between different actions.

<TypeScriptEditor>

```ts
import type { Manager, Middleware } from '@data-client/react';
import { actionTypes } from '@data-client/react';

export default class LoggingManager implements Manager {
  middleware: Middleware => controller => next => async action => {
    switch (action.type) {
      case actionTypes.SET_RESPONSE_TYPE:
        if (action.endpoint.sideEffect) {
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
          // wait for state update to be committed to React
          await next(action);
          // get the data from the store, which may be merged with existing state
          const { data } = controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          );
          console.info(`${action.endpoint.name} ${JSON.stringify(data)}`);
          return;
        }
      default:
        return next(action);
    }
  };

  cleanup() {}
}
```

</TypeScriptEditor>

In conditional blocks, the action [type narrows](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types),
encouraging safe access to its members.

In case we want to 'handle' a certain `action`, we can 'consume' it by not calling next.

<TypeScriptEditor>

```ts title="isEntity" collapsed
import type { Schema, EntityInterface } from '@data-client/core';

export default function isEntity(schema: Schema): schema is EntityInterface {
  return schema !== null && (schema as any).pk !== undefined;
}
```


```ts title="SubsManager"
import type { Manager, Middleware, EntityInterface } from '@data-client/react';
import { actionTypes } from '@data-client/react';
import isEntity from './isEntity';

export default class CustomSubsManager implements Manager {
  protected declare entities: Record<string, EntityInterface>;

  middleware: Middleware => controller => next => async action => {
    switch (action.type) {
      case actionTypes.SUBSCRIBE_TYPE:
      case actionTypes.UNSUBSCRIBE_TYPE:
        const { schema } = action.endpoint;
        // only process registered entities
        if (schema && isEntity(schema) && schema.key in this.entities) {
          if (action.type === actionTypes.SUBSCRIBE_TYPE) {
            this.subscribe(schema.key, action.args[0]?.product_id);
          } else {
            this.unsubscribe(schema.key, action.args[0]?.product_id);
          }

          // consume subscription if we use it
          return Promise.resolve();
        }
      default:
        return next(action);
    }
  };

  cleanup() {}

  subscribe(channel: string, product_id: string) {}
  unsubscribe(channel: string, product_id: string) {}
}
```

</TypeScriptEditor>

By `return Promise.resolve();` instead of calling `next(action)`, we prevent managers listed
after this one from seeing that action.

Types: `FETCH_TYPE`, `SET_TYPE`, `SET_RESPONSE_TYPE`, `RESET_TYPE`, `SUBSCRIBE_TYPE`,
`UNSUBSCRIBE_TYPE`, `INVALIDATE_TYPE`, `INVALIDATEALL_TYPE`, `EXPIREALL_TYPE`
