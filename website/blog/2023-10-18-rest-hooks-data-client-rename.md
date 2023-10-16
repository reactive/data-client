---
title: Rest Hooks is now Reactive Data Client
authors: [ntucker]
tags: [releases, rest-hooks, packages]
---

import PkgTabs from '@site/src/components/PkgTabs';

[![Reactive Data Client](/img/data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

As previously [voted and discussed](https://github.com/reactive/data-client/discussions/2407) we are renaming
this project to [Reactive Data Client](https://dataclient.io).

Transitioning to the @data-client packages, 

https://twitter.com/dataclientio


### Compatibility

| @rest-hooks/react                                                                         | @data-client/react | @rest-hooks/rest compatibility |
| ----------------------------------------------------------------------------------------- | ------------------ | ------------------------------ |
| [7.4](https://www.npmjs.com/package/@rest-hooks/react/v/7.4.3)                            | 0.1                | 3.1, 4.1, 5.2.1, 6.0+          |
| [8.0](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Freact%408.0.0) | 0.2                | 5.2.1, 6.0+                    |
| [8.1](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Freact%408.1.0) | 0.3                | 5.2.1, 6.0+                    |
| [8.2](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Freact%408.2.0) | 0.4                | 5.2.1, 6.0+                    |

| @rest-hooks/rest                                                                         | @data-client/rest | @rest-hooks/react compatibility |
| ---------------------------------------------------------------------------------------- | ----------------- |--|
| [6.7](https://www.npmjs.com/package/@rest-hooks/rest/v/6.7.2)                            | 0.1               | rest-hooks@5+, @rest-hooks/react@* |
| [7.0](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.0.0) | 0.2               | @rest-hooks/react@* |
| [7.1](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.1.0) | 0.4               | @rest-hooks/react@* |
| [7.2](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.2.0) | 0.5               | @rest-hooks/react@* |
| [7.3](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.3.0) | 0.6               | @rest-hooks/react@* |
| [7.4](https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.4.0) | 0.7               | @rest-hooks/react@* |

<!--truncate-->

### @rest-hooks/react 8.0

https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Freact%408.0.0

#### Changes

- [2692](https://github.com/reactive/data-client/pull/2692): Controller.fetch() returns denormalized form when Endpoint has a Schema

#### Removals of deprecated items

- [2691](https://github.com/reactive/data-client/pull/2691): Remove DispatchContext, DenormalizeCacheContext

#### Changes

- [2690](https://github.com/reactive/data-client/pull/2690): Deprecations:
  - controller.receive, controller.receiveError
  - RECEIVE_TYPE
  - MiddlewareAPI.controller (MiddlewareAPI is just controller itself)
    - ({controller}) => {} -> (controller) => {}
- [2690](https://github.com/reactive/data-client/pull/2690): NetworkManager interface changed to only support new actions
  SubscriptionManager/PollingSubscription interfaces simplified based on new actions

### @rest-hooks/rest 7.0

https://github.com/reactive/data-client/releases/tag/%40rest-hooks%2Frest%407.0.0

#### Removals of deprecated items

- [2690](https://github.com/reactive/data-client/pull/2690): Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- [2688](https://github.com/reactive/data-client/pull/2688) Remove FetchShape compatibility. This removes support for the legacy hooks in 'rest-hooks' like useResource()

#### Breaking changes

  9788090c55: RestEndpoint's getRequestInit and getHeaders optionally return a promise
  9788090c55: GetEndpoint and MutateEndpoint parameters changed to what NewXEndpoint was.
  9788090c55: createResource() generics changed to O extends ResourceGenerics This allows customizing the Resource type with body and searchParams
  9788090c55: createResource().getList uses a Collection, which .create appends to Remove any Endpoint.update as it is not necessary and will not work
