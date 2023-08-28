---
title: "SubscriptionManager"
sidebar_label: SubscriptionManager
---

```typescript
class SubscriptionManager<S extends SubscriptionConstructable> implements Manager
```

Orchestrates all subscriptions; ensuring fresh data without overfetching.

:::info implements

`SubscriptionManager` implements [Manager](./Manager.md)

:::

## constructor(Subscription: S)

[Subscription](#subscription) is the class that will be used to handle subscriptions to each endpoint.
Each instance represents one subscription to a specific unique endpoint.

## Consumed Actions

- 'rdc/subscribe'
- 'rdc/unsubscribe'

## Subscription

`Subscription` is a class that implements `SubscriptionConstructable`. `Subscription` instances
handle the actual subscriptions.

```typescript
/** Interface handling a single resource subscription */
interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
export interface SubscriptionConstructable {
  new (
    action: Omit<SubscribeAction, 'type'>,
    controller: Controller,
  ): Subscription;
}
```

### add(frequency?: number): void

Adds a new subscription at the provided frequency for the resource.

### remove(frequency?: number): boolean

Removes a subscription for the given frequency. Returns `true` if there are no
more subscriptions after. This is used to clean up unused `Subscription`s.

### cleanup(): void

Provides any cleanup of dangling resources after Subscription is no longer in use.

### Included implementation

* [PollingSubscription](./PollingSubscription)

:::note

Implementing your own `Subscription` to handle websockets can be done by
dispatching `rdc/receive` actions with the data it gets to update.
Be sure to handle connection opening in the constructor and close the connection
in `cleanup()`

:::
