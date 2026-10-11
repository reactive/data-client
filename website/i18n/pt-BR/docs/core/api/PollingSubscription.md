---
title: PollingSubscription
sidebar_label: PollingSubscription
---

import ProviderManagers from '../shared/_provider_managers.mdx';

Dispara uma action `fetch` no menor intervalo entre todas as subscriptions deste
resource.

- Pausa quando está offline.
- Faz fetch imediatamente quando o status online retorna.
- Faz fetch imediatamente de qualquer nova subscription.

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

## Actions despachadas {#dispatched-actions}

- 'rdc/fetch'

> #### Nota:
>
> Isso já é usado por padrão pelo :react[`DataProvider`]:vue[`DataClientPlugin`].
