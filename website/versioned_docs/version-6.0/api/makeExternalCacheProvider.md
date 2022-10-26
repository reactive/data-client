---
title: makeExternalCacheProvider()
---

```typescript
declare const makeExternalCacheProvider: (
  managers: Manager[],
  initialState?: State<unknown>,
) => ({ children }: { children: React.ReactNode }) => JSX.Element;
```

Used to build a [\<ExternalCacheProvider/\>](./ExternalCacheProvider.md) for [makeRenderRestHook()](./makeRenderRestHook.md)

Internally constructs a redux store attaching the middlwares.

## Arguments

### managers

[Manager](./Manager.md)

### initialState

Can be used to prime the cache if test expects cache values to already be filled.

## Returns

Simple wrapper component that only has child as prop.

```tsx
const manager = new MockNetworkManager();
const subscriptionManager = new SubscriptionManager(PollingSubscription);
const Provider = makeExternalCacheProvider([manager, subscriptionManager]);

function renderRestHook<T>(callback: () => T) {
  return renderHook(callback, {
    wrapper: ({ children }) => <Provider>{children}</Provider>,
  });
}
```
