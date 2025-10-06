# @data-client/test

## 0.15.0-beta-20251006024044-92bd01c4976f2921993b8c9f1e4dbb87af87ba7b

### Minor Changes

- [#3394](https://github.com/reactive/data-client/pull/3394) [`d44d36a`](https://github.com/reactive/data-client/commit/d44d36a7de0a18817486c4f723bf2f0e86ac9677) Thanks [@ntucker](https://github.com/ntucker)! - Change NetworkManager bookkeeping data structure for inflight fetches

  BREAKING CHANGE: NetworkManager.fetched, NetworkManager.rejectors, NetworkManager.resolvers, NetworkManager.fetchedAt
  -> NetworkManager.fetching

  #### Before

  ```ts
  if (action.key in this.fetched)
  ```

  #### After

  ```ts
  if (this.fetching.has(action.key))
  ```

- [`769cb78`](https://github.com/reactive/data-client/commit/769cb78966aed032c90864c701dae2bac0cc1e4d) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.15 of @data-client/react

### Patch Changes

- Updated dependencies [[`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`997ca20`](https://github.com/reactive/data-client/commit/997ca209d36e8503ab7684bccc6ddc29d179a0b5), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`35552c7`](https://github.com/reactive/data-client/commit/35552c716e3b688d69212654f9f95a05ea26a7f8)]:
  - @data-client/react@0.15.0-beta-20251006024044-92bd01c4976f2921993b8c9f1e4dbb87af87ba7b

## 0.14.22

### Patch Changes

- [#3390](https://github.com/reactive/data-client/pull/3390) [`32cccdb`](https://github.com/reactive/data-client/commit/32cccdb921cd8d7643b641a9e8872aa89782a94a) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys

- [#3390](https://github.com/reactive/data-client/pull/3390) [`32cccdb`](https://github.com/reactive/data-client/commit/32cccdb921cd8d7643b641a9e8872aa89782a94a) Thanks [@ntucker](https://github.com/ntucker)! - Interceptors that have args specified will still work, and warn about args.

  Example:

  ```typescript
  {
    endpoint: TodoResource.getList.push,
    args: [{ userId: '5' }, {}],
    response({ userId }, body) {
      return { id: Math.random(), userId, ...ensurePojo(body) };
    },
  }
  ```

  This is clearly an interceptor, but args were accidentally specified. Before
  this would make it not register, and TypeScript couldn't detect the issue.

  Now this is treated as an interceptor (args ignored); and there is a console warning

## 0.14.21

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

## 0.14.19

### Patch Changes

- [`060d8e1`](https://github.com/reactive/data-client/commit/060d8e19beb3eedab58a77764fd5f755b70e4946) Thanks [@ntucker](https://github.com/ntucker)! - Update @testing-library/react-native to v13

- [#3365](https://github.com/reactive/data-client/pull/3365) [`66e7336`](https://github.com/reactive/data-client/commit/66e7336bab0f6768d93c76882188894d36f84f88) Thanks [@ntucker](https://github.com/ntucker)! - fix: Interceptors work on manager-dispatched actions.

  For example, renderHook now can use resolverFixtures to resolve fetches for subscriptions.
  This was not possible before as SubscriptionManager's dispatches would not be intercepted with the
  previous implementation.

- [#3371](https://github.com/reactive/data-client/pull/3371) [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6) Thanks [@ntucker](https://github.com/ntucker)! - Add react-native entry to package.json exports

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

## 0.14.17

### Patch Changes

- [`4095003`](https://github.com/reactive/data-client/commit/4095003f40f4f6436a790d108ee13bcae1a2cdfa) Thanks [@ntucker](https://github.com/ntucker)! - Improve compatibility with React 19

## 0.14.16

### Patch Changes

- [#3238](https://github.com/reactive/data-client/pull/3238) [`28b702d`](https://github.com/reactive/data-client/commit/28b702d39d90cb36c93fe32d00548f2aea9dc58d) Thanks [@ntucker](https://github.com/ntucker)! - Add [renderDataHook()](https://dataclient.io/docs/api/renderDataHook) export

  This can be used instead of `makeRenderDataHook(DataProvider)`

  ```ts
  import { renderDataHook } from '@data-client/test';

  const { result, waitFor } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, { id: 5 });
    },
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response,
        },
      ],
    },
  );
  ```

- [#3244](https://github.com/reactive/data-client/pull/3244) [`109c922`](https://github.com/reactive/data-client/commit/109c922919ef401dee3c3c34d705819271f9e140) Thanks [@ntucker](https://github.com/ntucker)! - Support [actionTypes](https://dataclient.io/docs/api/Actions) without \_TYPE suffix

- [#3238](https://github.com/reactive/data-client/pull/3238) [`28b702d`](https://github.com/reactive/data-client/commit/28b702d39d90cb36c93fe32d00548f2aea9dc58d) Thanks [@ntucker](https://github.com/ntucker)! - Update test docs link

- [#3238](https://github.com/reactive/data-client/pull/3238) [`28b702d`](https://github.com/reactive/data-client/commit/28b702d39d90cb36c93fe32d00548f2aea9dc58d) Thanks [@ntucker](https://github.com/ntucker)! - makeRenderDataClient() -> [makeRenderDataHook()](https://dataclient.io/docs/api/makeRenderDataHook) (but keep the old name still)

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Update README to remove Entity.pk() when it is default ('id')

## 0.14.0

### Patch Changes

- [#3141](https://github.com/reactive/data-client/pull/3141) [`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: setResponseAction.payload -> setResponseAction.response

  This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
  inspect `SET_RESPONSE_TYPE` `action.payload`.

  #### Before

  ```ts
  import {
    SET_RESPONSE_TYPE,
    type Manager,
    type Middleware,
  } from '@data-client/react';

  export default class MyManager implements Manager {
    getMiddleware = (): Middleware => controller => next => async action => {
      switch (action.type) {
        case SET_RESPONSE_TYPE:
          console.log('Resolved with value', action.payload);
          return next(action);
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

  #### After

  ```ts
  import {
    SET_RESPONSE_TYPE,
    type Manager,
    type Middleware,
  } from '@data-client/react';

  export default class MyManager implements Manager {
    getMiddleware = (): Middleware => controller => next => async action => {
      switch (action.type) {
        case SET_RESPONSE_TYPE:
          console.log('Resolved with value', action.response);
          return next(action);
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

- [#3141](https://github.com/reactive/data-client/pull/3141) [`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: remove fetchAction.payload

  This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
  inspect `FETCH_TYPE` `action.fetch`.

  #### Before

  ```ts
  import {
    FETCH_TYPE,
    type Manager,
    type Middleware,
  } from '@data-client/react';

  export default class MyManager implements Manager {
    getMiddleware = (): Middleware => controller => next => async action => {
      switch (action.type) {
        case FETCH_TYPE:
          // consume fetch, and print the resolution
          action.fetch().then(response => console.log(response));
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

  #### After

  ```ts
  import {
    FETCH_TYPE,
    type Manager,
    type Middleware,
  } from '@data-client/react';

  export default class MyManager implements Manager {
    getMiddleware = (): Middleware => controller => next => async action => {
      switch (action.type) {
        case FETCH_TYPE:
          // consume fetch, and print the resolution
          action
            .endpoint(...action.meta.args)
            .fetch()
            .then(response => console.log(response));
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Expand peerdep support range to include ^0.14.0

- [`39471f5`](https://github.com/reactive/data-client/commit/39471f5e2a76e4bb4ee401020875ffa324f3eaf2) Thanks [@ntucker](https://github.com/ntucker)! - Add missing types export to @data-client/test/browser

## 0.13.0

### Patch Changes

- [#3105](https://github.com/reactive/data-client/pull/3105) [`cf770de`](https://github.com/reactive/data-client/commit/cf770de244ad890b286c59ac305ceb6c3b1288ea) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.13 of @data-client/react

## 0.12.13

### Patch Changes

- [`eebd453`](https://github.com/reactive/data-client/commit/eebd4537829248c02ad9c0b9c5ac988123366949) Thanks [@ntucker](https://github.com/ntucker)! - [MockResolver](https://dataclient.io/docs/api/MockResolver) marked as 'client' code for usage with NextJS

## 0.12.12

### Patch Changes

- [`764728e`](https://github.com/reactive/data-client/commit/764728e45c26088a815e2f49b55d4f4ccab4d388) Thanks [@ntucker](https://github.com/ntucker)! - Support unreleased versions of React 19

- [#3095](https://github.com/reactive/data-client/pull/3095) [`aab27d9`](https://github.com/reactive/data-client/commit/aab27d956a9b47c2fd5f79869c1e68373c3e5745) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider -> DataProvider

  CacheProvider name is still usable

## 0.12.8

### Patch Changes

- [#3071](https://github.com/reactive/data-client/pull/3071) [`7fba440`](https://github.com/reactive/data-client/commit/7fba44050a4e3fdcc37ab8405730b35366c293e1) Thanks [@ntucker](https://github.com/ntucker)! - React 19 JSX runtime compatibility.

  BREAKING CHANGE: Min React version 16.8.4 -> 16.14

  16.14 is the first version of React to include JSX runtime.

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

## 0.12.1

### Patch Changes

- Updated dependencies [[`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c), [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c), [`6e9d36b`](https://github.com/reactive/data-client/commit/6e9d36b6cb287763c0fcc3f07d9f2ef0df619d12)]:
  - @data-client/react@0.12.1

## 0.12.0

### Minor Changes

- [#3038](https://github.com/reactive/data-client/pull/3038) [`7a22440`](https://github.com/reactive/data-client/commit/7a224401d2601735b9a96f477d1975e23089e199) Thanks [@ntucker](https://github.com/ntucker)! - Rely on [ErrorBoundary](https://dataclient.io/docs/api/ErrorBoundary) from '@data-client/react' rather than error-boundary package.

  BREAKING CHANGE: This means only 0.11 and higher of '@data-client/react' is supported

### Patch Changes

- [#3038](https://github.com/reactive/data-client/pull/3038) [`7a22440`](https://github.com/reactive/data-client/commit/7a224401d2601735b9a96f477d1975e23089e199) Thanks [@ntucker](https://github.com/ntucker)! - Export renderHook() - React 17 & 18 compatible

## 0.11.5

### Patch Changes

- [#3030](https://github.com/reactive/data-client/pull/3030) [`068ae03`](https://github.com/reactive/data-client/commit/068ae0335d3e1c75a62393937a641a9578a2fa4e) Thanks [@renovate](https://github.com/apps/renovate)! - Use @testing-library/react-hooks act as it is fully compatible with 17,18,19 of React

- [`95524f8`](https://github.com/reactive/data-client/commit/95524f8818a485c35be4c095d83f397be6831f65) Thanks [@ntucker](https://github.com/ntucker)! - Prefer using act from 'react' (v19)

## 0.11.4

### Patch Changes

- [#3023](https://github.com/reactive/data-client/pull/3023) [`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5) Thanks [@renovate](https://github.com/apps/renovate)! - Compatibility with React 19 by removing defaultProps

## 0.11.0

### Patch Changes

- [`ba636a7`](https://github.com/reactive/data-client/commit/ba636a74e77bf5cb8c2b327e161db09f4c4a7192) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.11.0 of @data-client pkgs

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Update README

## 0.10.0

### Patch Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - Expand compatibility

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

## 0.9.0

### Patch Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Support devButton CacheProvider prop from 'react'

  BREAKING: `@data-client/redux` relies on new ProviderProps exported by `@data-client/react`

## 0.8.0

### Minor Changes

- [#2782](https://github.com/reactive/data-client/pull/2782) [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c) Thanks [@ntucker](https://github.com/ntucker)! - Requires @data-client/react@^0.5.0

- [#2788](https://github.com/reactive/data-client/pull/2788) [`ccaccdbe99`](https://github.com/reactive/data-client/commit/ccaccdbe9971d95556144e90a3afa41e8dc39183) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: makeRenderRestHook -> [makeRenderDataClient](https://dataclient.io/docs/api/makeRenderDataClient)

## 0.3.1

### Patch Changes

- ccaf9411c2: Support 0.4 @data-client/react

## 0.3.0

### Minor Changes

- a78831dc61: Support latest version in peerDeps

## 0.2.1

### Patch Changes

- 384e7b7030: Fix commonjs rollup build

## 0.2.0

### Minor Changes

- f98cb7b649: BREAKING: @testing-library/react-hooks must be installed when using React 16 or 17

## 0.1.4

### Patch Changes

- 7b835f113a: Improve package tags

## 0.1.3

### Patch Changes

- e916b88e45: Readme/package meta typo fixes

## 0.1.2

### Patch Changes

- 5cacc5d0cd: peerDeps compatibility with next versions

## 0.1.1

### Patch Changes

- e8667914f1: Fix peerDeps range
