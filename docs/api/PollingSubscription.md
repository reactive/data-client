# PollingSubscription implements [Subscription](./SubscriptionManager.md)

Will dispatch a `fetch` action at the minimum interval of all subscriptions to this
resource.

## Dispatched Actions

- 'rest-hooks/fetch'
