---
'@data-client/react': patch
'@data-client/core': patch
---

Add GCPolicy to control Garbage Collection of data in the store.

This can be configured with constructor options, or custom GCPolicies implemented by extending
or simply building your own. Use `ImmortalGCPolicy` to never GC (to maintain existing behavior).

### constructor

#### intervalMS = 60 \* 1000 \* 5

How long between low priority GC sweeps.

Longer values may result in more memory usage, but less performance impact.

#### expiryMultiplier = 2

Used in the default `hasExpired` policy.

Represents how many 'stale' lifetimes data should persist before being
garbage collected.

#### expiresAt

```typescript
expiresAt({
    fetchedAt,
    expiresAt,
}: {
  expiresAt: number;
  date: number;
  fetchedAt: number;
}): number {
  return (
    Math.max(
      (expiresAt - fetchedAt) * this.options.expiryMultiplier,
      120000,
    ) + fetchedAt
  );
}
```

Indicates at what timestamp it is acceptable to remove unused data from the store.

Data not currently rendered in any components is considered unused. However, unused
data may be used again in the future (as a cache).

This results in a tradeoff between memory usage and cache hit rate (and thus performance).