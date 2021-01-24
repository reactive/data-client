---
title: useMeta()
id: version-5.0-useMeta
original_id: useMeta
---

```typescript
function useMeta(
  endpoint: ReadEndpoint,
  params: object | null,
): {
    readonly date: number;
    readonly error?: Error | undefined;
    readonly expiresAt: number;
    readonly prevExpiresAt?: number | undefined;
    readonly invalidated?: boolean | undefined;
} | null;
```

Retrieves metadata about a request from the cache.

Used in

- [useError()](./useError)
