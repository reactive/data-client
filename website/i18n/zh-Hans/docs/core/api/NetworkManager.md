---
title: NetworkManager - 编排高效且无竞态条件的获取
sidebar_label: NetworkManager
---

# NetworkManager

NetworkManager 负责编排异步 fetch。通过跟踪所有进行中的请求，
它能够对使用 throttle 标志发起的相同请求进行去重。

:::info 实现

`NetworkManager` 实现了 [Manager](./Manager.md)

:::

## 生命周期 {#lifecycle}

### 成功 {#success}

import SuccessLifecycle from '../../rest/diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### 错误 {#error}

import ErrorLifecycle from '../../rest/diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## 成员 {#members}

### constructor(\{ dataExpiryLength = 60000, errorExpiryLength = 1000 }) {#constructor}

参数表示资源被视为“过时”之前的默认时间（以毫秒为单位）。

### middleware {#middleware}

#### 消费的 action {#consumed-actions}

- [fetch](./Controller.md#fetch)

会发起网络请求，并在完成后 dispatch。

#### 处理的 action {#processed-actions}

- [fetch](./Controller.md#fetch)
- [setResponse](./Controller.md#setResponse)
- [resetEntireStore](./Controller.md#resetEntireStore)

#### 派发的 action {#dispatched-actions}

- [resolve](./Controller.md#resolve)

### allSettled(): Promise {#allSettled}

在所有进行中的 fetch 完成后 resolve。概念上类似于 [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### skipLogging(action) {#skipLogging}

供 DevtoolsManager 判断是否记录某个 action

默认：

```ts
skipLogging(action: ActionTypes) {
  return action.type === FETCH && action.meta.key in this.fetched;
}
```

## 受保护成员 {#protected-members}

### handleFetch(fetchAction) {#handlefetch}

当 middleware 拦截到 'rdc/fetch' action 时调用。

随后会为某个 key 创建一个 promise，并可能发起网络
fetch。

仅当 action meta 指示时才使用 throttle。这对于
确保变更请求始终会被发出非常有价值。

### handleSet(setAction) {#handleset}

当 middleware 拦截到 set action 时调用。

会 resolve 与该 set key 关联的 promise。

### throttle(key, fetch) {#throttle}

确保任意时刻对于给定 key 只有一个请求在进行中

使用 key 获取进行中的 promise；如果不存在，
则创建一个新的 promise 并调用 fetch。

### getLastReset(): number {#getlastreset}

整个 store 上次被重置的时间戳

### clear(key) {#clear}

清除给定 key 的 promise 状态

### clearAll() {#clearall}

通过 reject 剩余的 promise 来确保所有 promise 都已完成
