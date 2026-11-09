---
title: PollingSubscription
sidebar_label: PollingSubscription
---

import ProviderManagers from '../shared/_provider_managers.mdx';

会以该资源所有订阅中的最小间隔派发 `fetch` action。

- 离线时暂停。
- 恢复在线时立即获取。
- 首次订阅时，在数据经过一个轮询间隔后获取。如果数据更旧，则立即获取。

:::info implements

`PollingSubscription` 实现了 [Subscription](./SubscriptionManager.md#subscription)

:::

<ProviderManagers imports={['NetworkManager', 'SubscriptionManager', 'PollingSubscription']}>

```ts
const managers = () => [
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

</ProviderManagers>

## 派发的 Actions {#dispatched-actions}

- 'rdc/fetch'

> #### 注意：
>
> :react[`DataProvider`]:vue[`DataClientPlugin`] 默认已经使用了它。
