---
title: Snapshot - 无竞态条件的安全数据访问
sidebar_label: Snapshot
---

# Snapshot

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointInterfaceSource from '!!raw-loader!../../../packages/endpoint/src/SnapshotInterface.ts';
import CodeBlock from '@theme/CodeBlock';
import GenericsTabs from '@site/src/components/GenericsTabs';
import VoteDemo from '../shared/\_VoteDemo.mdx';

Snapshot 会传给用于计算状态更新的用户自定义函数。它们让你可以基于当前状态，
安全且高效地访问反规范化后的数据。

```ts
interface Snapshot {
  get(schema, ...args)​ => DenormalizeNullable<typeof schema> | undefined;
  getResponse(endpoint, ...args)​ => { data, expiryStatus, expiresAt };
  getError(endpoint, ...args)​ => ErrorTypes | undefined;
  fetchedAt: number;
  abort: Error;
}
```

:::tip

使用 [Controller.snapshot()](./Controller.md#snapshot) 构造一个 snapshot

:::

## 用法 {#usage}

<VoteDemo />

## 成员 {#members}

### get(schema, ...args) {#get}

查询任意 [Queryable](./useQuery.md#queryable) [Schema](/rest/api/schema#schema-overview)。

### getResponse(endpoint, ...args) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

从给定的状态中获取指定 endpoint/args 组合对应的响应（具有全局引用稳定性）。

#### data {#data}

反规范化后的响应数据。保证所有成员都具有全局引用稳定性。

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

:::vue

Vue 组件只会在挂载时挂起；已挂载的组件在重新获取数据期间会继续显示原有数据。

:::

##### Valid {#valid}

- 永远不会挂起。
- 数据过时时可能会获取

##### InvalidIfStale {#invalidifstale}

- 数据过时时会挂起。
- 数据过时时可能会获取

##### Invalid {#invalid}

- 总是会挂起
- 总是会获取

#### expiresAt {#expiresat}

表示过期时间的数字。可与 Date.now() 进行比较。

### getError(endpoint, ...args) {#getError}

获取指定 endpoint 的错误（如果有）。没有错误时返回 undefined。


### fetchedAt {#fetchedat}

产生此 snapshot 的那次 fetch 被调用的时间。

### abort {#abort}

这是一个 Error，在 [Endpoint.getOptimisticResponse()](/rest/api/RestEndpoint#getoptimisticresponse)
中抛出它即可取消乐观更新。