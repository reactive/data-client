---
title: useController()
---

<head>
  <title>useController() - Imperative Controls for Rest Hooks</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

```typescript
function useController(): Controller;
```

Provides access to [Controller](./Controller.md) from React, which can be used for imperative control
over the cache. For instance [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate),
and [setResponse](./Controller.md#setResponse)

```tsx
import { useController } from '@rest-hooks/react';

function MyComponent({ id }) {
  const ctrl = useController();

  const handleRefresh = useCallback(
    async e => {
      await ctrl.fetch(MyResource.get, { id });
    },
    [fetch, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await ctrl.invalidate(MyResource.get, { id });
    },
    [invalidate, id],
  );

  const handleLogout = useCallback(
    async e => {
      ctrl.resetEntireStore();
    },
    [resetEntireStore],
  );
}
```
