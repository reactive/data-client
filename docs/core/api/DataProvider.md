---
title: '<DataProvider />'
---

<head>
  <title>DataProvider - Normalized async data management in React</title>
</head>

import Installation from '../shared/\_installation.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Manages state, providing all context needed to use the hooks. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

<Installation />

## Props

```typescript
interface ProviderProps {
  children: ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof Controller;
  devButton?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | null;
}
```

### initialState: State&lt;unknown\> {#initialState}

```typescript
type State<T> = Readonly<{
  entities: Readonly<{
    [fetchKey: string]: { [pk: string]: T } | undefined;
  }>;
  results: Readonly<{
    [url: string]: unknown | PK[] | PK | undefined;
  }>;
  meta: Readonly<{
    [url: string]: { date: number; error?: Error; expiresAt: number };
  }>;
}>;
```

Instead of starting with an empty cache, you can provide your own initial state. This can
be useful for testing, or rehydrating the cache state when using server side rendering.

### managers?: Manager[] {#managers}

Default Production:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Default Development:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

List of [Manager](./Manager.md#provided-managers)s use. This is the main extensibility point of the provider.

### Controller: typeof Controller {#Controller}

This allows you to extend [Controller](./Controller.md) to provide additional functionality.
This might be useful if you have additional actions you want to dispatch to custom [Managers](./Manager.md)

```tsx
class MyController extends Controller {
  doSomething = () => {
    console.log('hi');
  };
}

const RealApp = (
  <DataProvider Controller={MyController}>
    <App />
  </DataProvider>
);
```

### devButton

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

In development, a small button will appear that gives easy access to browser devtools if
installed. This option configures where it shows up, or if null will disable it altogether.

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null`

```tsx title="Disable button"
<DataProvider devButton={null}>
  <App/>
</DataProvider>
```

```tsx title="Place in top right corner"
<DataProvider devButton="top-right">
  <App/>
</DataProvider>
```

## defaultProps

```ts
import { defaultState, Controller } from '@data-client/core';

DataProvider.defaultProps = {
  initialState: defaultState as State<unknown>,
  Controller,
  devButton: 'bottom-right',
};
```
