---
frameworks: [react]
title: useError() - 访问错误元数据
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

提供关于某个请求的错误信息。

用于

- [useFetch()](./useFetch)
- [useSuspense()](./useSuspense)
- [useCache()](./useCache)
