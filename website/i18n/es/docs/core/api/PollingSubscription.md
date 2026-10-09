---
title: PollingSubscription
sidebar_label: PollingSubscription
---

import ProviderManagers from '../shared/_provider_managers.mdx';

Despachará una acción `fetch` con el intervalo mínimo de todas las suscripciones a este
recurso.

- Se pausa cuando no hay conexión.
- Obtiene los datos de inmediato cuando se recupera la conexión.
- Obtiene los datos de inmediato para cualquier suscripción nueva.

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

## Acciones despachadas {#dispatched-actions}

- 'rdc/fetch'

> #### Nota:
>
> :react[`DataProvider`]:vue[`DataClientPlugin`] ya lo usa por defecto.
