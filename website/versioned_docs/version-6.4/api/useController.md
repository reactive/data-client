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

Provides access to [Controller](./Controller.md) which can be used for imperative control
over the cache. For instance [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate),
and [receive](./Controller.md#receive)

```tsx
import { useController } from 'rest-hooks';

function MyComponent({ id }) {
  const { fetch, invalidate, resetEntireStore } = useController();

  const handleRefresh = useCallback(
    async e => {
      await fetch(MyResource.get, { id });
    },
    [fetch, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await invalidate(MyResource.get, { id });
    },
    [invalidate, id],
  );

  const handleLogout = useCallback(
    async e => {
      resetEntireStore();
    },
    [resetEntireStore],
  );
}
```
