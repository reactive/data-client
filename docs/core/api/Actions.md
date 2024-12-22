---
title: Actions communicate UI events to store updates
sidebar_label: Actions
---

import Grid from '@site/src/components/Grid';

# Actions

Actions are minimal descriptions of store updates.

They are [dispatched by Controller methods](./Controller.md#action-dispatchers) ->
[read and consumed by Manager middleware](./Manager.md#reading-and-consuming-actions) -> 
processed by [reducers](https://react.dev/reference/react/useReducer) registered with [DataProvider](./DataProvider.md)
to update the store's state.

Many actions use the same meta information:

```ts
interface ActionMeta {
  readonly fetchedAt: number;
  readonly date: number;
  readonly expiresAt: number;
}
```

## FETCH

<Grid wrap>

```ts
interface FetchMeta {
  fetchedAt: number;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
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

Sent by [Controller.fetch()](./Controller.md#fetch), [Controller.fetchIfStale()](./Controller.md#fetchIfStale),
[useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md), [useFetch()](./useFetch.md)

Read by [NetworkManager](./NetworkManager.md)

## SET

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

Sent by [Controller.set()](./Controller.md#set)

## SET_RESPONSE

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
  endpoint: Endpont('Todo.partialUpdate'),
  meta: {
    fetchedAt: '5:18:26.394 PM',
    date: '5:18:26.636 PM',
    expiresAt: '6:18:26.636 PM'
  },
  error: false
}
```

</Grid>

Sent by [Controller.setResponse()](./Controller.md#setResponse), [NetworkManager](./NetworkManager.md)

Read by [NetworkManager](./NetworkManager.md), [LogoutManager](./LogoutManager.md)

## RESET

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

Sent by [Controller.resetEntireStore()](./Controller.md#resetEntireStore)

Read by [NetworkManager](./NetworkManager.md)

## SUBSCRIBE

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

Sent by [Controller.subscribe()](./Controller.md#subscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

Read by [SubscriptionManager](./SubscriptionManager.md)

## UNSUBSCRIBE

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

Sent by [Controller.unsubscribe()](./Controller.md#unsubscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

Read by [SubscriptionManager](./SubscriptionManager.md)

## INVALIDATE

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

Sent by [Controller.invalidate()](./Controller.md#invalidate)

## INVALIDATEALL

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

Sent by [Controller.invalidateAll()](./Controller.md#invalidateAll)

## EXPIREALL

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

Sent by [Controller.expireAll()](./Controller.md#expireAll)

