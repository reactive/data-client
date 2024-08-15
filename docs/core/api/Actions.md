---
title: Flux Actions
sidebar_label: Actions
---

# Actions

Actions are minimal descriptions of something that happened in the application.

They can be [read and consumed by Manager middleware](./Manager.md#reading-and-consuming-actions).

Many actions use the same meta information:

```ts
interface ActionMeta {
  readonly fetchedAt: number;
  readonly date: number;
  readonly expiresAt: number;
}
```

## FETCH

```ts
interface FetchMeta {
  fetchedAt: number;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
}

interface FetchAction {
  type: typeof FETCH_TYPE;
  endpoint: Endpoint;
  args: readonly [...Parameters<Endpoint>];
  key: string;
  meta: FetchMeta;
}
```

Comes from [Controller.fetch()](./Controller.md#fetch), [Controller.fetchIfStale()](./Controller.md#fetchIfStale),
[useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md), [useFetch()](./useFetch.md)

## SET

```ts
interface SetAction {
  type: typeof SET_TYPE;
  schema: Queryable;
  args: readonly any[];
  meta: ActionMeta;
  value: {} | ((previousValue: Denormalize<Queryable>) => {});
}
```

Comes from [Controller.set()](./Controller.md#set)

## SET_RESPONSE

```ts
interface SetResponseAction {
  type: typeof SET_RESPONSE_TYPE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
  meta: ActionMeta;
  response: ResolveType<Endpoint> | Error;
  error: boolean;
}
```

Comes from [Controller.setResponse()](./Controller.md#setResponse), [NetworkManager](./NetworkManager.md)

## RESET

```ts
interface ResetAction {
  type: typeof RESET_TYPE;
  date: number;
}
```

Comes from [Controller.resetEntireStore()](./Controller.md#resetEntireStore)

## SUBSCRIBE

```ts
interface SubscribeAction {
  type: typeof SUBSCRIBE_TYPE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
}
```

Comes from [Controller.subscribe()](./Controller.md#subscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

## UNSUBSCRIBE

```ts
interface UnsubscribeAction {
  type: typeof UNSUBSCRIBE_TYPE;
  endpoint: Endpoint;
  args: readonly any[];
  key: string;
}
```

Comes from [Controller.unsubscribe()](./Controller.md#unsubscribe), [useSubscription()](./useSubscription.md), [useLive()](./useLive.md)

## INVALIDATE

```ts
interface InvalidateAction {
  type: typeof INVALIDATE_TYPE;
  key: string;
}
```

Comes from [Controller.invalidate()](./Controller.md#invalidate)

## INVALIDATEALL

```ts
interface InvalidateAllAction {
  type: typeof INVALIDATEALL_TYPE;
  testKey: (key: string) => boolean;
}
```

Comes from [Controller.invalidateAll()](./Controller.md#invalidateAll)

## EXPIREALL

```ts
interface ExpireAllAction {
  type: typeof EXPIREALL_TYPE;
  testKey: (key: string) => boolean;
}
```

Comes from [Controller.expireAll()](./Controller.md#expireAll)

