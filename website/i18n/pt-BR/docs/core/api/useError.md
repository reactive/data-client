---
frameworks: [react]
title: useError() - Acessando metadados de erro
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

Fornece informações de erro sobre uma requisição.

Usado em

- [useFetch()](./useFetch)
- [useSuspense()](./useSuspense)
- [useCache()](./useCache)
