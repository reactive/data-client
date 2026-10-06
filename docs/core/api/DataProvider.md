---
frameworks: [react]
title: DataProvider - Normalized async data management in React
sidebar_label: <DataProvider />
description: High performance, globally consistent data management in React
---

import Installation from '../shared/\_installation.mdx';
import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# &lt;DataProvider />

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
  Controller?: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
  devButton?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | null;
}
```

### initialState: State&lt;unknown\> {#initialState}

<StateType />

Instead of starting with an empty cache, you can provide your own initial state. This can
be useful for testing, or rehydrating the cache state when using server side rendering.

### managers?: Manager[] {#managers}

List of [Manager](./Manager.md)s use. This is the main extensibility point of the provider.

[getDefaultManagers()](./getDefaultManagers.md) can be used to extend the default managers.

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

### Controller?: Controller class {#Controller}

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

### gcPolicy?: GCInterface {#gcPolicy}

Removes data from the store once no component uses it and it has gone stale. Defaults to
`new GCPolicy()`.

```tsx
import { DataProvider, GCPolicy } from '@data-client/react';

const gcPolicy = new GCPolicy({ intervalMS: 60 * 1000 * 10 });

const RealApp = (
  <DataProvider gcPolicy={gcPolicy}>
    <App />
  </DataProvider>
);
```

<GCPolicyOptions />

### devButton

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

In development, a small button will appear that gives easy access to [browser devtools](../getting-started/debugging.md) if
installed. This option configures where it shows up, or if null will disable it altogether.

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null` = `'bottom-right'`

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
