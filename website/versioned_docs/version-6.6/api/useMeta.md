---
title: useMeta()
---

```typescript
function useMeta(
  endpoint: Endpoint,
  ...args: Parameters<typeof endpoint> | [null]
): {
  readonly date: number;
  readonly error?: NetworkError | UnknownError;
  readonly expiresAt: number;
  readonly prevExpiresAt?: number | undefined;
  readonly invalidated?: boolean | undefined;
} | null;
```

[NetworkError](./types#networkerror) [UnknownError](./types#unknownerror)

Retrieves metadata about a request from the cache.

Used in

- [useError()](./useError)
