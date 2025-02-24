---
'@data-client/react': patch
'@data-client/core': patch
---

Add GCPolicy to control Garbage Collection of data in the store.

This can be configured with constructor options, or custom GCPolicies implemented by extending
or simply building your own. Use `ImmortalGCPolicy` to never GC (to maintain existing behavior).

### constructor

#### intervalMS = 60 * 1000 * 5

How long between low priority GC sweeps.

Longer values may result in more memory usage, but less performance impact.

#### expiryMultiplier = 2

Used in the default `hasExpired` policy.

Represents how many 'stale' lifetimes data should persist before being
garbage collected.

#### hasExpired

```typescript
protected hasExpired({
  fetchedAt,
  expiresAt,
  now,
}: {
  expiresAt: number;
  date: number;
  fetchedAt: number;
  now: number;
}): boolean {
  return (
    Math.max(
      (expiresAt - fetchedAt) * this.options.expiryMultiplier,
      120000,
    ) +
      fetchedAt <
    now
  );
}
```

