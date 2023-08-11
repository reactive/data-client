# @data-client/core

## 0.3.0

### Minor Changes

- 6fd842e464: Add controller.expireAll() that sets all responses to _STALE_

  ```ts
  controller.expireAll(ArticleResource.getList);
  ```

  This is like controller.invalidateAll(); but will continue showing
  stale data while it is refetched.

  This is sometimes useful to trigger refresh of only data presently shown
  when there are many parameterizations in cache.

## 0.2.1

### Patch Changes

- 7b835f113a: Improve package tags
- Updated dependencies [7b835f113a]
  - @data-client/normalizr@0.2.2

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- bf141cb5a5: legacyActions were removed. use action imports directly
  New action types match previously exported newActions and have different form
  This will likely require updating any custom Managers
- bf141cb5a5: Deprecations:
  - controller.receive, controller.receiveError
  - RECEIVE_TYPE
  - MiddlewareAPI.controller (MiddlewareAPI is just controller itself)
    - ({controller}) => {} -> (controller) => {}
- bf141cb5a5: NetworkManager interface changed to only support new actions
  SubscriptionManager/PollingSubscription interfaces simplified based on new actions
- bf141cb5a5: reducer -> createReducer(new Controller())
- 9788090c55: Controller.fetch() returns denormalized form when Endpoint has a Schema
- bf141cb5a5: resetAction requires a date
- bf141cb5a5: state.lastReset must be number

### Patch Changes

- Updated dependencies [bf141cb5a5]
- Updated dependencies [87475a0cae]
  - @data-client/normalizr@0.2.0
