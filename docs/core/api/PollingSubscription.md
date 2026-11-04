---
title: PollingSubscription
sidebar_label: PollingSubscription
---

import ProviderManagers from '../shared/_provider_managers.mdx';

Will dispatch a `fetch` action at the minimum interval of all subscriptions to this
resource.

- Pauses when offline.
- Immediately fetches when online status returns.
- On the first subscription, fetches when the data is one interval old. If the data is older, fetches at once.

:::info implements

`PollingSubscription` implements [Subscription](./SubscriptionManager.md#subscription)

:::

<ProviderManagers imports={['NetworkManager', 'SubscriptionManager', 'PollingSubscription']}>

```ts
const managers = [
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

</ProviderManagers>

## Dispatched Actions

- 'rdc/fetch'

> #### Note:
>
> This is already used by :react[`DataProvider`]:vue[`DataClientPlugin`] by default.
