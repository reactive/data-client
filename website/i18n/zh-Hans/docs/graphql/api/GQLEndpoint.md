---
title: GQLEndpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import mutationDemo from '@site/src/components/Demo/code/profile-edit';
import CodeEditor from '@site/src/components/Demo/CodeEditor';

`GQLEndpoints` 用于基于 [GraphQL](https://graphql.org/) 的协议。

:::info 继承

`GQLEndpoint` 继承自 [Endpoint](/rest/api/Endpoint)

:::

## 用法 {#usage}

<CodeEditor codes={[mutationDemo[1]]} defaultValue="graphql" />

## query(gql, schema) {#query}

```ts
import { GQLEndpoint } from '@data-client/graphql';
import User from 'schema/User';

const gql = new GQLEndpoint('/');

export const getUser = gql.query(
  (v: { name: string }) => `query getUser($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);

getUser({ name: 'bob' });
```

## mutate(gql, schema) {#mutate}

```ts
import { GQLEndpoint } from '@data-client/graphql';
import User from 'schema/User';

const gql = new GQLEndpoint('/');

export const updateUser = gql.mutate(
  (v: Partial<User>) => `query updateUser($user: User!) {
    user(name: $user) {
      id
      name
      email
    }
  }`,
  { user: User },
);

updateUser({ id: '5', name: 'bob', email: 'bob@bob.com' });
```

## 获取的生命周期 {#fetch-lifecycle}

GQLEndpoint 在 Endpoint 的基础上，为其提供的 fetch 方法增加了定制能力。

1. _准备 fetch_
   1. url
   1. [getRequestInit()](#getRequestInit)
      - [getQuery()](#getQuery)
      - [getHeaders()](#getHeaders)
1. _执行 fetch_
   1. [fetchResponse()](#fetchResponse)
   1. [parseResponse()](#parseResponse)
   1. [process()](#process)

```ts title="fetch implementation for GQLEndpoint"
async function fetch(variables) {
  return this.fetchResponse(
    this.url,
    this.getRequestInit(variables),
  ).then(res => this.process(res, variables));
}
```

## 准备 Fetch {#prepare-fetch}

成员同时也是选项（构造函数的第二个参数）。虽然都不是必需的，但前几个
有默认值。

### url: string {#path}

GraphQL 对所有操作使用同一个 url。

### getRequestInit(body): RequestInit {#getRequestInit}

准备 fetch 中使用的 [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)。
它会被传给 [fetchResponse](#fetchResponse)

### getQuery(variables): string {#getQuery}

准备查询语句，作为 body 负载的一部分发送。

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

由 [getRequestInit](#getRequestInit) 调用，用于确定 [HTTP 请求头](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

这通常可用于[认证](../auth)

:::warning

不要在这里使用 hook。

:::

## 处理 fetch {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

执行 [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 调用

### parseResponse(response): Promise {#parseResponse}

接收 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)，并通过 .text() 或 .json() 进行解析

### process(value, ...args): any {#process}

对解析后的结果执行任意转换。默认为恒等函数。

## Endpoint 生命周期 {#endpoint-life-cycles}

### schema: Schema {#schema}

声明式地定义如何[处理响应](/docs/concepts/normalization)

- 在[何处](/docs/concepts/normalization)预期出现 [Entity](./GQLEntity.md)
- 用于反序列化字段的函数

不提供此选项意味着不会提取任何 Entity。

```tsx
import { GQLEntity, GQLEndpoint } from '@data-client/graphql';
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

class User extends GQLEntity {
  username = '';
}

export const getUser = gql.query(
  (v: { name: string }) => `query GetUser($name: String!) {
    user(name: $name) {
      id
      name
      email
    }
  }`,
  { user: User },
);
```

### dataExpiryLength?: number {#dataexpirylength}

为所获取资源自定义数据缓存的生命周期。会覆盖 NetworkManager 中设置的值。

[进一步了解过期时间](/docs/concepts/expiry-policy#expiry-time)

### errorExpiryLength?: number {#errorexpirylength}

为所获取资源自定义错误的生命周期。会覆盖 NetworkManager 中设置的值。

### errorPolicy?: (error: any) => 'soft' | undefined {#errorpolicy}

'soft' 会在出错时使用过时数据（如果存在）；值为 undefined 或不提供此选项则会导致
报错。

[进一步了解 errorPolicy](/docs/concepts/error-policy)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

### invalidIfStale: boolean {#invalidifstale}

表示过时数据应被视为不可用，因此不会从缓存中返回。这意味着
即使数据已存在于缓存中，只要它过时了，useSuspense() 就会挂起。

### pollFrequency: number {#pollfrequency}

轮询的频率，单位为毫秒。需要配合 [useSubscription()](/docs/api/useSubscription) 或
[useLive()](/docs/api/useLive) 使用才会生效。

### getOptimisticResponse: (snap, ...args) => fakePayload {#getoptimisticresponse}

提供此函数后，使用该 endpoint 的任何获取都会表现得如同此函数返回的 `fakePayload`
是一次成功的网络响应。当实际获取完成时（无论
失败还是成功），乐观更新都会被实际的网络响应替换。

## extend(options): Endpoint {#extend}

可用于进一步定制 endpoint 的定义

```typescript
const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

const authGQL = gql.extend({
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```
