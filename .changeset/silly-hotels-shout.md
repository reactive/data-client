---
'@data-client/react': patch
---

Add gcPolicy option to [DataProvider](https://dataclient.io/docs/api/DataProvider) and [prepareStore](https://dataclient.io/docs/guides/redux)

```tsx
// run GC sweep every 10min
<DataProvider gcPolicy={new GCPolicy({ intervalMS: 60 * 1000 * 10 })}>{children}</DataProvider>
```

```ts
const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
  gcPolicy: new GCPolicy({ intervalMS: 60 * 1000 * 10 }),
);
```

Use `ImmortalGCPolicy` to never GC (to maintain existing behavior):

```tsx
import { ImmortalGCPolicy, DataProvider } from '@data-client/react';

<DataProvider gcPolicy={new ImmortalGCPolicy()}>{children}</DataProvider>
```