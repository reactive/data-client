---
title: useController()
---

<head>
  <title>useController() - Imperative Controls for Rest Hooks</title>
</head>

```typescript
function useController(): Controller;
```

Provides access to [Controller](./Controller.md)

```tsx
import { useController } from 'rest-hooks';

function MyComponent({ id }) {
  const { fetch, invalidate, resetEntireStore } = useController();

  const handleRefresh = useCallback(
    async e => {
      await fetch(MyResource.detail(), { id });
    },
    [fetch, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await invalidate(MyResource.detail(), { id });
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
