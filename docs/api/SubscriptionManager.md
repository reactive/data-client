# SubscriptionManager\<S extends SubscriptionConstructable> implements [Manager](./Manager.md)

Keeps track of all resource subscriptions.

## constructor(Subscription: S)

`Subscription` is a class that implements `SubscriptionConstructable`. `Subscription` instances
handle the actual subscriptions.

```typescript
/** Properties sent to Subscription constructor */
export interface SubscriptionInit {
  schema: Schema;
  fetch: () => Promise<any>;
  url: string;
  frequency?: number;
}

/** Interface handling a single resource subscription */
interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
interface SubscriptionConstructable {
  new (init: SubscriptionInit, dispatch: React.Dispatch<any>): Subscription;
}
```

An implementation: [PollingSubscription](./PollingSubscription.md) is provided
that dispatches fetches at a given interval. However, if you use something like websockets
you should be able to easily write your own provided you match the interface above.
(A websocket `Subscription` should be dispatching `rest-hooks/receive` actions with
the data it gets to update.)

## Consumed Actions

- 'rest-hooks/subscribe'
- 'rest-hooks/unsubscribe'
