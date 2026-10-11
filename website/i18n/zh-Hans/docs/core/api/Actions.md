---
title: Actions 将 UI 事件传达为 store 更新
sidebar_label: Actions
---

import Grid from '@site/src/components/Grid';

# Actions

Actions 是对 store 更新的最小描述。

它们[由 Controller 方法派发](./Controller.md#action-dispatchers) ->
[由 Manager 中间件读取和消费](./Manager.md#reading-and-consuming-actions) -> 
再由注册在 :react[[DataProvider](./DataProvider.md)]:vue[[DataClientPlugin](./DataClientPlugin.md)] 上的 [reducers](https://react.dev/reference/react/useReducer) 处理，
从而更新 store 的状态。

许多 action 使用相同的 meta 信息：

```ts
interface ActionMeta {
  readonly fetchedAt: number;
  readonly date: number;
  readonly expiresAt: number;
}
```

## FETCH {#fetch}

<Grid wrap>

```ts
interface FetchMeta {
  fetchedAt: number;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: Promise<any>;
}

interface FetchAction {
  type: typeof actionTypes.FETCH;
  endpoint: Endpoint;
  args: readonly [...Parameters<Endpoint>];
  key: string;
  meta: FetchMeta;
}
```

```js
{
  type: 'rdc/fetch',
  key: 'GET https://jsonplaceholder.typicode.com/todos?userId=1',
  args: [
    {
      userId: 1
    }
  ],
  endpoint: Endpoint('User.getList'),
  meta: {
    fetchedAt: '5:09:41.975 PM',
    resolve: function (){},
    reject: function (){},
    promise: {}
  }
}
```

</Grid>

由 [Controller.fetch()](./Controller.md#fetch), [Controller.fetchIfStale()](./Controller.md#fetchIfStale), 发送
[useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md), [useFetch()](./useFetch.md)

由 [NetworkManager](./NetworkManager.md) 读取

## SET {#set}

<Grid wrap>

```ts
interface SetAction {
  type: typeof actionTypes.SET;
  schema: Queryable;
  args: readonly any[];
  meta: ActionMeta;
  value: {} | ((previousValue: Denormalize<Queryable>) => {});
}
```

```js
{
  type: 'rdc/set',
  value: {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: true
  },
  args: [
    {
      id: 1
    }
  ],
  schema: Todo,
  meta: {
    fetchedAt: '5:18:26.394 PM',
    date: '5:18:26.636 PM',
    expiresAt: '6:18:26.636 PM'
  }
}
```

</Grid>

由 [Controller.set()](./Controller.md#set) 发送

## SET_RESPONSE {#set_response}

<Grid wrap>

```ts
interface SetResponseAction {
  type: typeof actionTypes.SET_RESPONSE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
  meta: ActionMeta;
  response: ResolveType<Endpoint> | Error;
  error: boolean;
}
```

```js
{
  type: 'rdc/setresponse',
  key: 'PATCH https://jsonplaceholder.typicode.com/todos/1',
  response: {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: true
  },
  args: [
    {
      id: 1
    },
    {
      completed: true
    }
  ],
  endpoint: Endpoint('Todo.partialUpdate'),
  meta: {
    fetchedAt: '5:18:26.394 PM',
    date: '5:18:26.636 PM',
    expiresAt: '6:18:26.636 PM'
  },
  error: false
}
```

</Grid>

由 [Controller.setResponse()](./Controller.md#setResponse), [NetworkManager](./NetworkManager.md) 发送

由 [NetworkManager](./NetworkManager.md), [LogoutManager](./LogoutManager.md) 读取

## RESET {#reset}

<Grid wrap>

```ts
interface ResetAction {
  type: typeof actionTypes.RESET;
  date: number;
}
```

```js
{
  type: 'rdc/reset',
  date: '5:09:41.975 PM',
}
```

</Grid>

由 [Controller.resetEntireStore()](./Controller.md#resetEntireStore) 发送

由 [NetworkManager](./NetworkManager.md) 读取

## SUBSCRIBE {#subscribe}

<Grid wrap>

```ts
interface SubscribeAction {
  type: typeof actionTypes.SUBSCRIBE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
}
```

```js
{
  type: 'rdc/subscribe',
  key: 'GET https://api.exchange.coinbase.com/products/BTC-USD/ticker',
  args: [
    {
      product_id: 'BTC-USD'
    }
  ],
  endpoint: Endpoint('https://api.exchange.coinbase.com/products/:product_id/ticker'),
}
```

</Grid>

由 [Controller.subscribe()](./Controller.md#subscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md) 发送

由 [SubscriptionManager](./SubscriptionManager.md) 读取

## UNSUBSCRIBE {#unsubscribe}

<Grid wrap>

```ts
interface UnsubscribeAction {
  type: typeof actionTypes.UNSUBSCRIBE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
}
```

```js
{
  type: 'rdc/unsubscribe',
  key: 'GET https://api.exchange.coinbase.com/products/BTC-USD/ticker',
  args: [
    {
      product_id: 'BTC-USD'
    }
  ],
  endpoint: Endpoint('https://api.exchange.coinbase.com/products/:product_id/ticker'),
}
```

</Grid>

由 [Controller.unsubscribe()](./Controller.md#unsubscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md) 发送

由 [SubscriptionManager](./SubscriptionManager.md) 读取

## INVALIDATE {#invalidate}

<Grid wrap>

```ts
interface InvalidateAction {
  type: typeof actionTypes.INVALIDATE;
  key: string;
}
```

```js
{
  type: 'rdc/invalidate',
  key: 'GET https://jsonplaceholder.typicode.com/todos?userId=1',
}
```

</Grid>

由 [Controller.invalidate()](./Controller.md#invalidate) 发送

## INVALIDATEALL {#invalidateall}

<Grid wrap>

```ts
interface InvalidateAllAction {
  type: typeof actionTypes.INVALIDATEALL;
  testKey: (key: string) => boolean;
}
```

```js
{
  type: 'rdc/invalidateall',
  testKey: Endpoint('User.getList'),
}
```

</Grid>

由 [Controller.invalidateAll()](./Controller.md#invalidateAll) 发送

## EXPIREALL {#expireall}

<Grid wrap>

```ts
interface ExpireAllAction {
  type: typeof actionTypes.EXPIREALL;
  testKey: (key: string) => boolean;
}
```

```js
{
  type: 'rdc/expireall',
  testKey: Endpoint('User.getList'),
}
```

</Grid>

由 [Controller.expireAll()](./Controller.md#expireAll) 发送

