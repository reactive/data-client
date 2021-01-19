---
title: Custom Resource cache lifetime
sidebar_label: Custom cache lifetime
---

By default the NetworkManager specifies the lifetime of data and errors in the cache.
If some resources are longer living, or shorter living than other, you can specify their own expiry length values,
which will be passed on to all [Endpoint](../api/Endpoint.md) creator functions of [Resource](../api/Resource.md).

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
