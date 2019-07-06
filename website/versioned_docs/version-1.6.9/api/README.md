---
title: API Reference
id: version-1.6.9-README
original_id: README
---

## Interface Definitions
- [Resource](Resource.md)
- [RequestShape](RequestShape.md)

## Hooks
- [useResource](useResource.md)
- [useFetcher](useFetcher.md)
- [useCache](useCache.md)
- [useResultCache](useResultCache.md)
- [useSubscription](useSubscription.md)
- [useRetrieve](useRetrieve.md)
- [useInvalidator](useInvalidator.md)

## Components
- [RestProvider](RestProvider.md)
- [ExternalCacheProvider](ExternalCacheProvider.md)
- [NetworkErrorBoundary](NetworkErrorBoundary.md)

## [Manager](Manager.md)s

Extended the networking/state layer works through [managers](Manager.md).

- [NetworkManager](NetworkManager.md)
- [SubscriptionManager](SubscriptionManager.md)
  - [PollingSubscription](PollingSubscription.md)

## Testing

Testing utilities are imported from `rest-hooks/testing`. These are useful
helpers to ensure your code works as intended and are not meant to be shipped
to production themselves.

- [\<MockProvider />](MockProvider)
- [makeRenderRestHook()](makeRenderRestHook)
- [makeRestProvider()](makeRestProvider)
- [makeExternalCacheProvider()](makeExternalCacheProvider)

