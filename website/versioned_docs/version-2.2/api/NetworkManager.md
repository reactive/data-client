---
title: NetworkManager implements Manager
sidebar_label: NetworkManager
id: NetworkManager
original_id: NetworkManager
---
NetworkManager orchestrates asynchronous fetches. By keeping track of all in-flight requests
it is able to dedupe identical requests if they are made using the throttle flag.

## constructor(dataExpiryLength: number = 60000, errorExpiryLength: number = 1000)

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
