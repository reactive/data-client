---
title: useError() - Accessing error metadata
sidebar_label: useError()
---

# useError()

```typescript
export interface SyntheticError extends Error {
  status: number;
  response?: undefined;
  synthetic: true;
}

function useError(
  endpoint: Endpoint,
  ...args: Parameters<typeof endpoint> | [null]
): NetworkError | Unknown | SyntheticError | undefined;
```

[NetworkError](./types#networkerror)

Provides error information about a request.

Used in

- [useFetch()](./useFetch)
- [useSuspense()](./useSuspense)
- [useCache()](./useCache)
