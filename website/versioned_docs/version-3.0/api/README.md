---
title: API Reference
id: README
original_id: README
---

## Interface Definitions
- [Resource](Resource.md)
- [FetchShape](FetchShape.md)

## Hooks
- [useResource](useResource.md)
- [useResourceLegacy](useResourceLegacy.md)
- [useFetcher](useFetcher.md)
- [useCache](useCache.md)
- [useCacheLegacy](useCacheLegacy.md)
- [useSubscription](useSubscription.md)
- [useRetrieve](useRetrieve.md)
- [useInvalidator](useInvalidator.md)
- [useResetter](useResetter.md)

## Components
- [CacheProvider](CacheProvider.md)
- [ExternalCacheProvider](ExternalCacheProvider.md)
- [NetworkErrorBoundary](NetworkErrorBoundary.md)

## [Manager](Manager.md)s

Extended the networking/state layer works through [managers](Manager.md).

- [NetworkManager](NetworkManager.md)
- [SubscriptionManager](SubscriptionManager.md)
  - [PollingSubscription](PollingSubscription.md)

## Testing

Testing utilities are imported from `@rest-hooks/test`. These are useful
helpers to ensure your code works as intended and are not meant to be shipped
to production themselves.

- [\<MockProvider /\>](MockProvider)
- [makeRenderRestHook()](makeRenderRestHook)
- [makeCacheProvider()](makeCacheProvider)
- [makeExternalCacheProvider()](makeExternalCacheProvider)
