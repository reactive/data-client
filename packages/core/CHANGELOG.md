# @data-client/core

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/normalizr@0.9.4

## 0.9.3

### Patch Changes

- [#2818](https://github.com/reactive/data-client/pull/2818) [`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles and update names

  - Client packages namespace into RDC
    - @data-client/react - RDC
    - @data-client/core - RDC.Core
    - @data-client/redux - RDC.Redux
  - Definition packages namespace top level
    - @data-client/rest - Rest
    - @data-client/graphql - GraphQL
    - @data-client/img - Img
    - @data-client/endpoint - Endpoint
  - Utility
    - @data-client/normalizr - normalizr
    - @data-client/use-enhanced-reducer - EnhancedReducer

- [`327b94bedc`](https://github.com/reactive/data-client/commit/327b94bedc280e25c1766b3a51cc20078bfa1739) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add logo to readme

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95)]:
  - @data-client/normalizr@0.9.3

## 0.9.2

### Patch Changes

- [`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2) Thanks [@ntucker](https://github.com/ntucker)! - Better track state changes between each action

  Since React 18 batches updates, the real state can
  sometimes update from multiple actions, making it harder
  to debug. When devtools are open, instead of getting
  the real state - track a shadow state that accurately reflects
  changes from each action.

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/normalizr@0.9.2

## 0.9.0

### Patch Changes

- [`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526) Thanks [@ntucker](https://github.com/ntucker)! - Endpoint properties fully visible in devtool

- [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b) Thanks [@ntucker](https://github.com/ntucker)! - DevTools no longer forgets history if not open on page load

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - DevtoolsManager closing start queueing messages to improve efficiency

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

## 0.8.0

### Minor Changes

- [`837cf57883`](https://github.com/reactive/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083) Thanks [@ntucker](https://github.com/ntucker)! - Remove newActions export

  (All members continue to be exported at top level)

- [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Remove all /next exports

- [#2786](https://github.com/reactive/data-client/pull/2786) [`c865415ce5`](https://github.com/reactive/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a) Thanks [@ntucker](https://github.com/ntucker)! - [Middleware](https://dataclient.io/docs/api/Manager#getmiddleware) no longer gets `controller` prop.

  The entire API is controller itself:
  `({controller}) => next => async action => {}` ->
  `(controller) => next => async action => {}`

  ```ts
  class LoggingManager implements Manager {
    getMiddleware = (): Middleware => controller => next => async action => {
      console.log('before', action, controller.getState());
      await next(action);
      console.log('after', action, controller.getState());
    };

    cleanup() {}
  }
  ```

  Note this has been possible for some time this simply drops
  legacy compatibility.

- [#2784](https://github.com/reactive/data-client/pull/2784) [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGES:

  - DELETE removed -> INVALIDATE
  - drop all support for legacy schemas
    - entity.expiresAt removed
    - Collections.infer does entity check
    - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation

- [#2782](https://github.com/reactive/data-client/pull/2782) [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c) Thanks [@ntucker](https://github.com/ntucker)! - Remove all 'receive' action names (use 'set' instead)

  BREAKING CHANGE:

  - remove ReceiveAction
  - ReceiveTypes -> SetTypes
  - remove Controller.receive Controller.receiveError
  - NetworkManager.handleReceive -> handleSet

- [#2781](https://github.com/reactive/data-client/pull/2781) [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853) Thanks [@ntucker](https://github.com/ntucker)! - Prefix action types with 'rdc'

  BREAKING CHANGE: Action types have new names

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

- Updated dependencies [[`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1), [`35ccedceb5`](https://github.com/reactive/data-client/commit/35ccedceb53d91dd54dd996990c7c75719be2b85)]:
  - @data-client/normalizr@0.8.0

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

## 0.4.2

### Patch Changes

- b60a4a558e: Change internal organization of some types

## 0.4.1

### Patch Changes

- a097d25e7a: controller.fetchIfStale() resolves to data from store if it does not fetch

## 0.4.0

### Minor Changes

- 5cedd4485e: Add controller.fetchIfStale()

  Fetches only if endpoint is considered '[stale](../concepts/expiry-policy.md#stale)'; otherwise returns undefined.

  This can be useful when prefetching data, as it avoids overfetching fresh data.

  An [example](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) with a fetch-as-you-render router:

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
