---
title: useMeta()
---

```typescript
function useMeta(
  endpoint: Endpoint,
  params: object | null,
): {
    readonly date: number;
    readonly error?: NetworkError | Error | undefined;
    readonly expiresAt: number;
    readonly prevExpiresAt?: number | undefined;
    readonly invalidated?: boolean | undefined;
} | null;
```

[NetworkError](./types#networkerror)

Retrieves metadata about a request from the cache.

Used in

- [useError()](./useError)
