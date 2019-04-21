---
title: <ExternalCacheProvider />
---
Integrates external stores with `rest-hooks`. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

**Is a replacement for \<RestProvider /> - do _NOT_ use both at once**

`index.tsx`

```tsx
import { ExternalCacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

import store from './store';

ReactDOM.render(
  <ExternalCacheProvider store={store} selector={s => s}>
    <App />
  </ExternalCacheProvider>,
  document.body,
);
```

See [redux example](../guides/redux.md) for a more complete example.

## store

```typescript
interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
}
```

Store simply needs to conform to this interface. A common implementation is a [redux store](https://redux.js.org/api/store),
but theoretically any external store could be used.

[Read more about integrating redux.](../guides/redux.md)

## selector: (state: Object) => State<unknown>

This function is used to retrieve the `rest-hooks` specific part of the store's state tree.
