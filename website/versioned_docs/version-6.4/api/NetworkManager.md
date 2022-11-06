---
title: NetworkManager
sidebar_label: NetworkManager
---

NetworkManager orchestrates asynchronous fetches. By keeping track of all in-flight requests
it is able to dedupe identical requests if they are made using the throttle flag.

:::info implements

`NetworkManager` implements [Manager](./Manager.md)

:::

## constructor(dataExpiryLength = 60000, errorExpiryLength = 1000) {#constructor}

Arguments represent the default time (in miliseconds) before a resource is considered 'stale'.

## Consumed Actions

- 'rest-hooks/fetch'

Will initiate network request and then dispatch upon completion.

## Processed Actions

- 'rest-hooks/purge'
- 'rest-hooks/rpc'
- 'rest-hooks/receive'

Marks request as complete.

## Dispatched Actions

- 'rest-hooks/purge'
- 'rest-hooks/rpc'
- 'rest-hooks/receive'

## Protected members

### handleFetch(fetchAction, dispatch, controller)

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
