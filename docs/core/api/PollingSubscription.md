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
import { createRoot } from 'react-dom/client';

const managers = [
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription)
]

createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

## Dispatched Actions

- 'rdc/fetch'

> #### Note:
>
> This is already used by `DataProvider` by default.
