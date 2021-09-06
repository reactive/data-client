---
title: PollingSubscription implements Subscription
sidebar_label: PollingSubscription
hide_title: true
id: PollingSubscription
original_id: PollingSubscription
---

# PollingSubscription implements [Subscription](./SubscriptionManager.md)

Will dispatch a `fetch` action at the minimum interval of all subscriptions to this
resource.

- Pauses when offline.
- Immediately fetches when online status returns.
- Immediately fetches any new subscriptions.

```tsx
import {
  SubscriptionManager,
  PollingSubscription,
  CacheProvider,
} from 'rest-hooks';
import ReactDOM from 'react-dom';

const subscriptionManager = new SubscriptionManager(PollingSubscription);

ReactDOM.render(
  <CacheProvider subscriptionManager={subscriptionManager}>
    <App />
  </CacheProvider>,
  document.body,
);
```

## Dispatched Actions

- 'rest-hooks/fetch'

> #### Note:
>
> This is already used by `CacheProvider` by default.
