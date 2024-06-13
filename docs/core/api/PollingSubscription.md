---
title: PollingSubscription
sidebar_label: PollingSubscription
---

Will dispatch a `fetch` action at the minimum interval of all subscriptions to this
resource.

- Pauses when offline.
- Immediately fetches when online status returns.
- Immediately fetches any new subscriptions.

:::info implements

`PollingSubscription` implements [Subscription](./SubscriptionManager.md#subscription)

:::

```tsx
import {
  SubscriptionManager,
  PollingSubscription,
  DataProvider,
  NetworkManager,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = [
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription)
]

ReactDOM.render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
  document.body,
);
```

## Dispatched Actions

- 'rdc/fetch'

> #### Note:
>
> This is already used by `DataProvider` by default.
