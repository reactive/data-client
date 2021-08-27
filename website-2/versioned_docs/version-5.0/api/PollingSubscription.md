---
title: PollingSubscription implements Subscription
sidebar_label: PollingSubscription
hide_title: true
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
  NetworkManager,
} from 'rest-hooks';
import ReactDOM from 'react-dom';

const managers = [
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription)
]

ReactDOM.render(
  <CacheProvider managers={managers}>
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
