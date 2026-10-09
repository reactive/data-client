---
title: "SubscriptionManager"
sidebar_label: SubscriptionManager
---

```typescript
class SubscriptionManager<S extends SubscriptionConstructable> implements Manager
```

统一协调所有订阅，确保数据新鲜且不会过度获取。

:::info 实现

`SubscriptionManager` 实现了 [Manager](./Manager.md)

:::

## constructor(Subscription: S) {#constructorsubscription-s}

[Subscription](#subscription) 是用于处理每个 endpoint 订阅的类。
每个实例代表对某个特定唯一 endpoint 的一个订阅。

## 消费的 Action {#consumed-actions}

- 'rdc/subscribe'
- 'rdc/unsubscribe'

## Subscription {#subscription}

`Subscription` 是一个实现了 `SubscriptionConstructable` 的类。`Subscription` 实例
负责处理实际的订阅。

```typescript
/** Interface handling a single resource subscription */
interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
export interface SubscriptionConstructable {
  new (
    action: Omit<SubscribeAction, 'type'>,
    controller: Controller,
  ): Subscription;
}
```

### add(frequency?: number): void {#addfrequency-number-void}

以给定频率为该资源添加一个新订阅。

### remove(frequency?: number): boolean {#removefrequency-number-boolean}

移除给定频率的订阅。如果移除后不再有任何订阅，
则返回 `true`。这用于清理不再使用的 `Subscription`。

### cleanup(): void {#cleanup-void}

在 Subscription 不再使用后，清理所有残留的资源。

### 内置实现 {#included-implementation}

* [PollingSubscription](./PollingSubscription)

:::note

要实现自己的 `Subscription` 来处理 websocket，可以用收到的数据
[dispatch](./Controller.md#set) `rdc/set` action 来进行更新。
务必在构造函数中建立连接，并在 `cleanup()` 中
关闭连接。

:::
