---
title: useError()
---

```typescript
function useError(
  endpoint: ReadEndpoint,
  params: object | null,
): Error & { status?: number };
```

Provides error information about a request. This builds on [useMeta()](./useMeta),
but adds some additional logic.

Used in

- [useRetrieve()](./useRetrieve)
- [useResource()](./useResource)
- [useCache()](./useCache)
