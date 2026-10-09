---
frameworks: [react]
title: useError() - Acceso a los metadatos de error
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

Proporciona información de error sobre una petición.

Se usa en

- [useFetch()](./useFetch)
- [useSuspense()](./useSuspense)
- [useCache()](./useCache)
