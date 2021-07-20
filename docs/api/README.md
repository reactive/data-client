---
title: API Reference
---

## Interface Definitions
- [Resource](Resource.md)
- [Entity](Entity.md)
- [SimpleRecord](SimpleRecord.md)
- [Endpoint](Endpoint.md)

### Hierarchy

```
 SimpleRecord
      |
   Entity
      |
SimpleResource
      |
   Resource
```

## Hooks
- [useResource](useResource.md)
- [useFetcher](useFetcher.md)
- [useCache](useCache.md)
- [useSubscription](useSubscription.md)
- [useRetrieve](useRetrieve.md)
- [useInvalidator](useInvalidator.md)
- [useResetter](useResetter.md)

## Components
- [CacheProvider](CacheProvider.md)
- [ExternalCacheProvider](ExternalCacheProvider.md)
- [NetworkErrorBoundary](NetworkErrorBoundary.md)

## [Managers](Manager.md)

Extended the networking/state layer works through [managers](Manager.md).

- [NetworkManager](NetworkManager.md)
- [SubscriptionManager](SubscriptionManager.md)
  - [PollingSubscription](PollingSubscription.md)

## Testing

Testing utilities are imported from `@rest-hooks/test`. These are useful
helpers to ensure your code works as intended and are not meant to be shipped
to production themselves.

- [\<MockProvider />](MockProvider)
- [makeRenderRestHook()](makeRenderRestHook)
- [makeCacheProvider()](makeCacheProvider)
- [makeExternalCacheProvider()](makeExternalCacheProvider)
