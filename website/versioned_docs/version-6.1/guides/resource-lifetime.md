---
title: Custom Resource cache lifetime
sidebar_label: Custom cache lifetime
---

Customizing [Expiry Policy](../getting-started/expiry-policy.md) for can be done for all of
a [Resource's endpoints](../api/resource#detail) by using [getEndpointExtra](../api/resource#getEndpointExtra)

## Examples

### Long cache lifetime

`LongLivingResource.ts`

```typescript
// We can now extend LongLivingResource to get a resource that will be cached for one hour
abstract class LongLivingResource extends Resource {
  static getEndpointExtra() {
    return {
      ...super.getEndpointExtra(),
      dataExpiryLength: 60 * 60 * 1000, // one hour
    };
  }
}
```

### Never retry on error

`NoRetryResource.ts`

```typescript
// We can now extend NoRetryResource to get a resource that will never retry on network error
abstract class NoRetryResource extends Resource {
  static getEndpointExtra() {
    return {
      ...super.getEndpointExtra(),
      errorExpiryLength: Infinity,
    };
  }
}
```
