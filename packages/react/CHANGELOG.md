# @data-client/react

## 0.8.0

### Minor Changes

- [`f65cf832f0`](https://github.com/data-client/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Remove all /next exports

- [#2787](https://github.com/data-client/data-client/pull/2787) [`8ec35d7143`](https://github.com/data-client/data-client/commit/8ec35d71437c4042c6cb824eceb490d31c36ae21) Thanks [@ntucker](https://github.com/ntucker)! - Remove makeCacheProvider

  Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderDataClient)

  ```tsx
  import { CacheProvider } from '@data-client/react';
  const renderDataClient = makeRenderDataClient(CacheProvider);
  ```

- [#2785](https://github.com/data-client/data-client/pull/2785) [`c6a2071178`](https://github.com/data-client/data-client/commit/c6a2071178c82c7622713c40c5a9fa5807c4e756) Thanks [@ntucker](https://github.com/ntucker)! - Add className to error boundary and errorClassName to [AsyncBoundary](https://dataclient.io/docs/api/AsyncBoundary)

  ```tsx
  <AsyncBoundary errorClassName="error">
    <Stuff/>
  </AsyncBounary>
  ```

  ```tsx
  <NetworkErrorBoundary className="error">
    <Stuff />
  </NetworkErrorBoundary>
  ```

- [#2784](https://github.com/data-client/data-client/pull/2784) [`c535f6c0ac`](https://github.com/data-client/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGES:

  - DELETE removed -> INVALIDATE
  - drop all support for legacy schemas
    - entity.expiresAt removed
    - Collections.infer does entity check
    - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation

- [#2782](https://github.com/data-client/data-client/pull/2782) [`d3343d42b9`](https://github.com/data-client/data-client/commit/d3343d42b970d075eda201cb85d201313120807c) Thanks [@ntucker](https://github.com/ntucker)! - Remove all 'receive' action names (use 'set' instead)

  BREAKING CHANGE:

  - remove ReceiveAction
  - ReceiveTypes -> SetTypes
  - remove Controller.receive Controller.receiveError
  - NetworkManager.handleReceive -> handleSet

- [#2791](https://github.com/data-client/data-client/pull/2791) [`a726d9178a`](https://github.com/data-client/data-client/commit/a726d9178a60fd81ff97d862ed4943e1fd4814c0) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider elements no longer share default managers

  New export: `getDefaultManagers()`

  BREAKING CHANGE: Newly mounted CacheProviders will have new manager
  objects when default is used

- [#2795](https://github.com/data-client/data-client/pull/2795) [`79e286109b`](https://github.com/data-client/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) _must_ support function calls

  This means Date will no longer work like before. Possible migrations:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: Temporal.Instant.from,
    };
  }
  ```

  or to continue using Date:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: (iso: string) => new Date(iso),
    };
  }
  ```

- [#2781](https://github.com/data-client/data-client/pull/2781) [`5ff1d65eb5`](https://github.com/data-client/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853) Thanks [@ntucker](https://github.com/ntucker)! - Prefix action types with 'rdc'

  BREAKING CHANGE: Action types have new names

### Patch Changes

- [#2779](https://github.com/data-client/data-client/pull/2779) [`ff51e71f45`](https://github.com/data-client/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

- Updated dependencies [[`837cf57883`](https://github.com/data-client/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083), [`f65cf832f0`](https://github.com/data-client/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04), [`c865415ce5`](https://github.com/data-client/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a), [`ff51e71f45`](https://github.com/data-client/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/data-client/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`d3343d42b9`](https://github.com/data-client/data-client/commit/d3343d42b970d075eda201cb85d201313120807c), [`5ff1d65eb5`](https://github.com/data-client/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853)]:
  - @data-client/core@0.8.0

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
