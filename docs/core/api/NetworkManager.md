---
title: NetworkManager
sidebar_label: NetworkManager
---

<head>
  <title>NetworkManager - Orchestrating efficient race-condition free fetching</title>
</head>


NetworkManager orchestrates asynchronous fetches. By keeping track of all in-flight requests
it is able to dedupe identical requests if they are made using the throttle flag.

:::info implements

`NetworkManager` implements [Manager](./Manager.md)

:::

## Members

### constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {#constructor}

Arguments represent the default time (in miliseconds) before a resource is considered 'stale'.

### middleware

#### Consumed Actions

- [fetch](./Controller.md#fetch)

Will initiate network request and then dispatch upon completion.

#### Processed Actions

- [fetch](./Controller.md#fetch)
- [setResponse](./Controller.md#setResponse)
- [resetEntireStore](./Controller.md#resetEntireStore)

#### Dispatched Actions

- [resolve](./Controller.md#resolve)

### allSettled(): Promise {#allSettled}

Resolves once all fetches inflight are complete. Conceptually [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

### skipLogging(action) {#skipLogging}

Used by DevtoolsManager to determine whether to log an action

Default:

```ts
skipLogging(action: ActionTypes) {
  return action.type === FETCH_TYPE && action.meta.key in this.fetched;
}
```

## Protected members

### handleFetch(fetchAction)

Called when middleware intercepts 'rest-hooks/fetch' action.

Will then start a promise for a key and potentially start the network
fetch.

Uses throttle only when instructed by action meta. This is valuable
for ensures mutation requests always go through.

### handleReceive(receiveAction)

Called when middleware intercepts a receive action.

Will resolve the promise associated with receive key.

### throttle(key, fetch)

Ensures only one request for a given key is in flight at any time

Uses key to either retrieve in-flight promise, or if not
create a new promise and call fetch.

### getLastReset(): number

Timestamp when entire store was last reset

### clear(key)

Clear promise state for a given key

### clearAll()

Ensures all promises are completed by rejecting remaining

