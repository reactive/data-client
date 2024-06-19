---
title: "<ExternalDataProvider />"
---

import PkgTabs from '@site/src/components/PkgTabs';

Integrates external stores with `Reactive Data Client`. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

:::warning

**Is a replacement for [&lt;DataProvider /\>](./DataProvider.md) - do _NOT_ use both at once**

:::

## Installation

## Usage

```tsx title="index.tsx"
import { ExternalDataProvider } from '@data-client/react/redux';
import ReactDOM from 'react-dom';

import { store, selector } from './store';

ReactDOM.render(
  <ExternalDataProvider store={store} selector={selector}>
    <App />
  </ExternalDataProvider>,
  document.body,
);
```

See [redux example](../guides/redux.md) for a more complete example.

## Props

### store

```typescript
interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
}
```

Store simply needs to conform to this interface. A common implementation is a [redux store](https://redux.js.org/api/store),
but theoretically any external store could be used.

[Read more about integrating redux.](../guides/redux.md)

### selector

```typescript
(state: S) => State<unknown>
```

This function is used to retrieve the `Reactive Data Client` specific part of the store's state tree.

### controller

[Controller](./Controller.md) instance to use.

### devButton

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

In development, a small button will appear that gives easy access to browser devtools if
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