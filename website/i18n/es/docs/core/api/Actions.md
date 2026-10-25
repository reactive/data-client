---
title: Las Actions comunican eventos de la UI como actualizaciones del store
sidebar_label: Actions
---

import Grid from '@site/src/components/Grid';

# Actions

Las Actions son descripciones mínimas de las actualizaciones del store.

Son [despachadas por los métodos de Controller](./Controller.md#action-dispatchers) ->
[leídas y consumidas por el middleware de Manager](./Manager.md#reading-and-consuming-actions) -> 
procesadas por los [reducers](https://react.dev/reference/react/useReducer) registrados con :react[[DataProvider](./DataProvider.md)]:vue[[DataClientPlugin](./DataClientPlugin.md)]
para actualizar el estado del store.

Muchas actions usan la misma información meta:

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

Enviada por [Controller.fetch()](./Controller.md#fetch), [Controller.fetchIfStale()](./Controller.md#fetchIfStale),
[useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md), [useFetch()](./useFetch.md)

Leída por [NetworkManager](./NetworkManager.md)

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

Enviada por [Controller.set()](./Controller.md#set)

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

Enviada por [Controller.setResponse()](./Controller.md#setResponse), [NetworkManager](./NetworkManager.md)

Leída por [NetworkManager](./NetworkManager.md), [LogoutManager](./LogoutManager.md)

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

Enviada por [Controller.resetEntireStore()](./Controller.md#resetEntireStore)

Leída por [NetworkManager](./NetworkManager.md)

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

Enviada por [Controller.subscribe()](./Controller.md#subscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

Leída por [SubscriptionManager](./SubscriptionManager.md)

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

Enviada por [Controller.unsubscribe()](./Controller.md#unsubscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

Leída por [SubscriptionManager](./SubscriptionManager.md)

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

Enviada por [Controller.invalidate()](./Controller.md#invalidate)

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

Enviada por [Controller.invalidateAll()](./Controller.md#invalidateAll)

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

Enviada por [Controller.expireAll()](./Controller.md#expireAll)

