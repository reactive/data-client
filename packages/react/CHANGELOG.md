# @data-client/react

## 0.4.3

### Patch Changes

- f95dbc64d1: [Collections](https://dataclient.io/rest/api/Collection) can filter based on FormData arguments

  ```ts
  ctrl.fetch(getPosts.push, { group: 'react' }, new FormData(e.currentTarget));
  ```

  Say our FormData contained an `author` field. Now that newly created
  item will be properly added to the [collection list](https://dataclient.io/rest/api/Collection) for that author.

  ```ts
  useSuspense(getPosts, {
    group: 'react',
    author: 'bob',
  });
  ```

  In this case if `FormData.get('author') === 'bob'`, it will show
  up in that [useSuspense()](https://dataclient.io/docs/api/useSuspense) call.

  See more in the [Collection nonFilterArgumentKeys example](https://dataclient.io/rest/api/Collection#nonfilterargumentkeys)

- Updated dependencies [f95dbc64d1]
  - @data-client/core@0.4.3

## 0.4.2

### Patch Changes

- 991c415135: Update readme
- Updated dependencies [b60a4a558e]
  - @data-client/core@0.4.2

## 0.4.1

### Patch Changes

- a097d25e7a: controller.fetchIfStale() resolves to data from store if it does not fetch
- Updated dependencies [a097d25e7a]
  - @data-client/core@0.4.1

## 0.4.0

### Minor Changes

- 5cedd4485e: Add controller.fetchIfStale()

  Fetches only if endpoint is considered '[stale](../concepts/expiry-policy.md#stale)'; otherwise returns undefined.

  This can be useful when prefetching data, as it avoids overfetching fresh data.

  An [example](https://stackblitz.com/github/data-client/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) with a fetch-as-you-render router:

  ```ts
  {
    name: 'IssueList',
    component: lazyPage('IssuesPage'),
    title: 'issue list',
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
      searchParams: URLSearchParams,
    ) => {
      const q = searchParams?.get('q') || 'is:issue is:open';
      await controller.fetchIfStale(IssueResource.search, {
        owner,
        repo,
        q,
      });
    },
  },
  ```

### Patch Changes

- Updated dependencies [5cedd4485e]
  - @data-client/core@0.4.0

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

### Patch Changes

- 6fd842e464: Update README examples to have more options configured
- Updated dependencies [6fd842e464]
  - @data-client/core@0.3.0

## 0.2.3

### Patch Changes

- 7b835f113a: Improve package tags
- Updated dependencies [7b835f113a]
  - @data-client/core@0.2.1

## 0.2.2

### Patch Changes

- f1550bfef1: docs: Update readme examples based on project root readme
- 960b120f56: docs: Update hash links for Managers
- 954e06e839: docs: Update README
- 8eb1d2a651: docs: Update README links for docs site changes

## 0.2.1

### Patch Changes

- e916b88e45: Readme/package meta typo fixes

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
