---
title: makeExternalCacheProvider()
---

```typescript
declare const makeExternalCacheProvider: (
  managers: Manager[],
  initialState?: State<unknown>,
) => ({ children }: { children: React.ReactNode }) => JSX.Element;
```

:::caution Deprecated

In @rest-hooks/test>=10, [<CacheProvider /\>](./CacheProvider.md) from `@rest-hooks/redux` should be used directly

For previous versions, this is used to build a [<ExternalCacheProvider /\>](./ExternalCacheProvider.md) for [makeRenderRestHook()](./makeRenderRestHook.md)

:::

Internally constructs a redux store attaching the middlwares.

## Arguments

### managers

[Manager](./Manager.md)

### initialState

Can be used to prime the cache if test expects cache values to already be filled.

## Returns

Simple wrapper component that only has child as prop.

```tsx
import makeCacheProvider from '@rest-hooks/redux/makeCacheProvider';

const manager = new MockNetworkManager();
const subscriptionManager = new SubscriptionManager(PollingSubscription);
const Provider = makeExternalCacheProvider([manager, subscriptionManager]);

function renderRestHook<T>(callback: () => T) {
  return renderHook(callback, {
    wrapper: ({ children }) => <Provider>{children}</Provider>,
  });
}
```
