---
title: useController()
---

<head>
  <title>useController() - Imperative Controls for Rest Hooks</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

[Controller](./Controller.md) provides type-safe methods to manipulate the store.

For instance [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate),
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
