# @data-client/react

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- bf141cb5a5: Deprecations:
  - controller.receive, controller.receiveError
  - RECEIVE_TYPE
  - MiddlewareAPI.controller (MiddlewareAPI is just controller itself)
    - ({controller}) => {} -> (controller) => {}
- 54019cbd57: Remove DispatchContext, DenormalizeCacheContext (previously deprecated)
- 54019cbd57: Add INVALID to \_\_INTERNAL\_\_
- bf141cb5a5: createFetch, createReceive, createReceiveError removed from \_\_INTERNAL\_\_
  These were previously deprecated.
- bf141cb5a5: NetworkManager interface changed to only support new actions
  SubscriptionManager/PollingSubscription interfaces simplified based on new actions
- 9788090c55: Controller.fetch() returns denormalized form when Endpoint has a Schema

### Patch Changes

- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [9788090c55]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
  - @data-client/core@0.2.0
