---
title: useError()
id: version-5.0-useError
original_id: useError
---

```typescript
interface SyntheticError extends Error {
  status: number;
  synthetic: boolean;
}

function useError(
  endpoint: Endpoint,
  params: object | null,
): NetworkError | Error | SyntheticError | undefined;
```

[NetworkError](./types#networkerror)

Provides error information about a request. This builds on [useMeta()](./useMeta),
but adds some additional logic.

Used in

- [useRetrieve()](./useRetrieve)
- [useResource()](./useResource)
- [useCache()](./useCache)
