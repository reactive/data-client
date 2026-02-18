# @data-client/core

## 0.15.7

### Patch Changes

- [#3738](https://github.com/reactive/data-client/pull/3738) [`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1) - Optimistic updates support FormData

- Updated dependencies []:
  - @data-client/normalizr@0.15.4

## 0.15.4

### Patch Changes

- [#3703](https://github.com/reactive/data-client/pull/3703) [`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57) Thanks [@ntucker](https://github.com/ntucker)! - Improve normalize/denormalize performance 10-15%
  - Replace `Object.keys().forEach()` with indexed for loops
  - Replace `reduce()` with spreading to direct object mutation
  - Cache getter results to avoid repeated property lookups
  - Centralize arg extraction with pre-allocated loop
  - Eliminate Map double-get pattern

  #### Microbenchmark Results

  | #   | Optimization                 | Before            | After             | Improvement      |
  | --- | ---------------------------- | ----------------- | ----------------- | ---------------- |
  | 1   | **forEach → forLoop**        | 7,164 ops/sec     | 7,331 ops/sec     | **+2.3%**        |
  | 2   | **reduce+spread → mutation** | 912 ops/sec       | 7,468 ops/sec     | **+719% (8.2x)** |
  | 3   | **getter repeated → cached** | 1,652,211 ops/sec | 4,426,994 ops/sec | **+168% (2.7x)** |
  | 4   | **slice+map → indexed**      | 33,221 ops/sec    | 54,701 ops/sec    | **+65% (1.65x)** |
  | 5   | **Map double-get → single**  | 23,046 ops/sec    | 23,285 ops/sec    | **+1%**          |

  #### Impact Summary by Codepath

  | Codepath                                   | Optimizations Applied | Expected Improvement |
  | ------------------------------------------ | --------------------- | -------------------- |
  | **normalize** (setResponse)                | 1, 2, 4               | 10-15%               |
  | **denormalize** (getResponse)              | 1, 2, 4               | 10-15%               |
  | **Controller queries** (get, getQueryMeta) | 5, 6                  | 5-10%                |

- [`09056b0`](https://github.com/reactive/data-client/commit/09056b0adf1375e0aa17df6c1db6f73f721c518f) Thanks [@ntucker](https://github.com/ntucker)! - Simplify endpoint.update() error message

- Updated dependencies [[`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57)]:
  - @data-client/normalizr@0.15.4

## 0.15.3

### Patch Changes

- [#3691](https://github.com/reactive/data-client/pull/3691) [`bf3ac79`](https://github.com/reactive/data-client/commit/bf3ac7966dc615b1dc6cc6c6d600148fdca4e354) Thanks [@ntucker](https://github.com/ntucker)! - Fix CommonJS compatibility for `/mock` subpath exports.

  Jest and other CommonJS consumers can now import from `@data-client/react/mock` and `@data-client/core/mock` without ESM parsing errors.

- [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133) Thanks [@ntucker](https://github.com/ntucker)! - Fix image links in package README

## 0.15.0

### Minor Changes

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: schema.normalize(...args, addEntity, getEntity, checkLoop) -> schema.normalize(...args, delegate)

  We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

  ```ts
  /** Helpers during schema.normalize() */
  export interface INormalizeDelegate {
    /** Action meta-data for this normalize call */
    readonly meta: { fetchedAt: number; date: number; expiresAt: number };
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity;
    /** Updates an entity using merge lifecycles when it has previously been set */
    mergeEntity(
      schema: Mergeable & { indexes?: any },
      pk: string,
      incomingEntity: any,
    ): void;
    /** Sets an entity overwriting any previously set values */
    setEntity(
      schema: { key: string; indexes?: any },
      pk: string,
      entity: any,
      meta?: { fetchedAt: number; date: number; expiresAt: number },
    ): void;
    /** Returns true when we're in a cycle, so we should not continue recursing */
    checkLoop(key: string, pk: string, input: object): boolean;
  }
  ```

  #### Before

  ```ts
  addEntity(this, processedEntity, id);
  ```

  #### After

  ```ts
  delegate.mergeEntity(this, id, processedEntity);
  ```

- [#3451](https://github.com/reactive/data-client/pull/3451) [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d) Thanks [@ntucker](https://github.com/ntucker)! - state.entityMeta -> state.entitiesMeta

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

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: schema.queryKey(args, queryKey, getEntity, getIndex) -> schema.queryKey(args, unvisit, delegate)
  BREAKING CHANGE: delegate.getIndex() returns the index directly, rather than object.

  We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

  Our recursive call is renamed from queryKey to unvisit, and does not require the last two arguments.

  ```ts
  /** Accessors to the currently processing state while building query */
  export interface IQueryDelegate {
    getEntity: GetEntity;
    getIndex: GetIndex;
  }
  ```

  #### Before

  ```ts
  queryKey(args, queryKey, getEntity, getIndex) {
    getIndex(schema.key, indexName, value)[value];
    getEntity(this.key, id);
    return queryKey(this.schema, args, getEntity, getIndex);
  }
  ```

  #### After

  ```ts
  queryKey(args, unvisit, delegate) {
    delegate.getIndex(schema.key, indexName, value);
    delegate.getEntity(this.key, id);
    return unvisit(this.schema, args);
  }
  ```

### Patch Changes

- [`a4092a1`](https://github.com/reactive/data-client/commit/a4092a14999bfe3aa5cf613bb009264ec723ff99) Thanks [@ntucker](https://github.com/ntucker)! - Add mockInitialState to /mock

  ```ts
  import { mockInitialState } from '@data-client/react/mock';
  import { ArticleResource } from './resources';

  const state = mockInitialState([
    {
      endpoint: ArticleResource.get,
      args: [{ id: 5 }],
      response: { id: 5, title: 'Hello', content: 'World' },
    },
  ]);
  ```

- [#3622](https://github.com/reactive/data-client/pull/3622) [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042) Thanks [@ntucker](https://github.com/ntucker)! - Add @data-client/core/mock

  New exports:
  - `MockController` - Controller wrapper for mocking endpoints
  - `collapseFixture` - Resolves fixture responses (handles function responses)
  - `createFixtureMap` - Separates fixtures into static map and interceptors
  - Types: `MockProps`, `Fixture`, `SuccessFixture`, `ErrorFixture`, `Interceptor`, `ResponseInterceptor`, `FetchInterceptor`, `FixtureEndpoint`, `SuccessFixtureEndpoint`, `ErrorFixtureEndpoint`

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - Fix controller.get and controller.getQueryMeta 'state' argument types

- [#3558](https://github.com/reactive/data-client/pull/3558) [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f) Thanks [@ntucker](https://github.com/ntucker)! - Normalize delegate.invalidate() first argument only has `key` param.

  `indexes` optional param no longer provided as it was never used.

  ```ts
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string {
    delegate.invalidate({ key: this._entity.key }, pk);
    return pk;
  }
  ```

- [#3468](https://github.com/reactive/data-client/pull/3468) [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance of get/denormalize for small responses
  - 10-20% performance improvement due to removing immutablejs check for every call

- Updated dependencies [[`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`246cde6`](https://github.com/reactive/data-client/commit/246cde6dbeca59eafd10e59d8cd05a6f232fb219), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2), [`269b45e`](https://github.com/reactive/data-client/commit/269b45e835251cff847776078e51c0a593b62715), [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2), [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`66e1906`](https://github.com/reactive/data-client/commit/66e19064d21225c70639f3b4799e54c259ce6905), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`25b153a`](https://github.com/reactive/data-client/commit/25b153a9d80db1bcd17ab5558dfa13b333f112b8), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7)]:
  - @data-client/normalizr@0.15.0

## 0.14.24

### Patch Changes

- [`d41f658`](https://github.com/reactive/data-client/commit/d41f6582478f9392bcbcbcc1213f7a2d9646e9c4) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys [#3390](https://github.com/reactive/data-client/pull/3390)

## 0.14.23

### Patch Changes

- [`9bf7e7a`](https://github.com/reactive/data-client/commit/9bf7e7ab783eda767dd9f17bbf65c4b85c05d522) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys [#3390](https://github.com/reactive/data-client/pull/3390)

## 0.14.21

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

- Updated dependencies [[`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3)]:
  - @data-client/normalizr@0.14.21

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

- Updated dependencies [[`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de)]:
  - @data-client/normalizr@0.14.20

## 0.14.19

### Patch Changes

- [#3343](https://github.com/reactive/data-client/pull/3343) [`1df829e`](https://github.com/reactive/data-client/commit/1df829e0a005f5973d59669aaf0a226250346a40) Thanks [@ntucker](https://github.com/ntucker)! - Add initManager()

- [#3373](https://github.com/reactive/data-client/pull/3373) [`f796b6c`](https://github.com/reactive/data-client/commit/f796b6cbd33cce1f258bd5e95a7d6b1d51365f2f) Thanks [@ntucker](https://github.com/ntucker)! - Add Controller.getQueryMeta and Controller.getResponseMeta

- [#3373](https://github.com/reactive/data-client/pull/3373) [`f796b6c`](https://github.com/reactive/data-client/commit/f796b6cbd33cce1f258bd5e95a7d6b1d51365f2f) Thanks [@ntucker](https://github.com/ntucker)! - Controller.snapshot() methods have stronger argument typing

- [#3365](https://github.com/reactive/data-client/pull/3365) [`66e7336`](https://github.com/reactive/data-client/commit/66e7336bab0f6768d93c76882188894d36f84f88) Thanks [@ntucker](https://github.com/ntucker)! - internal: Controller.bindMiddleware() to be used in applyMiddleware.

  This API is not intended to be used elsewhere, but will become the standard interface between
  Controller's and applyMiddleware.

- [#3343](https://github.com/reactive/data-client/pull/3343) [`1df829e`](https://github.com/reactive/data-client/commit/1df829e0a005f5973d59669aaf0a226250346a40) Thanks [@ntucker](https://github.com/ntucker)! - Add GCPolicy to control Garbage Collection of data in the store.

  This can be configured with constructor options, or custom GCPolicies implemented by extending
  or simply building your own. Use `ImmortalGCPolicy` to never GC (to maintain existing behavior).

  ### constructor

  #### intervalMS = 60 \* 1000 \* 5

  How long between low priority GC sweeps.

  Longer values may result in more memory usage, but less performance impact.

  #### expiryMultiplier = 2

  Used in the default `hasExpired` policy.

  Represents how many 'stale' lifetimes data should persist before being
  garbage collected.

  #### expiresAt

  ```typescript
  expiresAt({
      fetchedAt,
      expiresAt,
  }: {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  }): number {
    return (
      Math.max(
        (expiresAt - fetchedAt) * this.options.expiryMultiplier,
        120000,
      ) + fetchedAt
    );
  }
  ```

  Indicates at what timestamp it is acceptable to remove unused data from the store.

  Data not currently rendered in any components is considered unused. However, unused
  data may be used again in the future (as a cache).

  This results in a tradeoff between memory usage and cache hit rate (and thus performance).

- [#3371](https://github.com/reactive/data-client/pull/3371) [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6) Thanks [@ntucker](https://github.com/ntucker)! - Add react-native entry to package.json exports

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

- Updated dependencies [[`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6), [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6)]:
  - @data-client/normalizr@0.14.19

## 0.14.18

### Patch Changes

- [`3906fc2`](https://github.com/reactive/data-client/commit/3906fc2fec2b958a44d718934919b524e851f298) Thanks [@ntucker](https://github.com/ntucker)! - SUBSCRIBE action field ordering consistent with other actions

## 0.14.16

### Patch Changes

- [#3244](https://github.com/reactive/data-client/pull/3244) [`109c922`](https://github.com/reactive/data-client/commit/109c922919ef401dee3c3c34d705819271f9e140) Thanks [@ntucker](https://github.com/ntucker)! - Add [actionTypes](https://dataclient.io/docs/api/Actions) without \_TYPE suffix

  (Not breaking - we keep the old actionTypes name as well.)

  ```ts title="Before"
  import type { Manager, Middleware } from '@data-client/react';
  import { actionTypes } from '@data-client/react';

  export default class LoggingManager implements Manager {
    middleware: Middleware = controller => next => async action => {
      switch (action.type) {
        case actionTypes.SET_RESPONSE_TYPE:
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

  ```ts title="After"
  import type { Manager, Middleware } from '@data-client/react';
  import { actionTypes } from '@data-client/react';

  export default class LoggingManager implements Manager {
    middleware: Middleware = controller => next => async action => {
      switch (action.type) {
        case actionTypes.SET_RESPONSE:
          console.info(
            `${action.endpoint.name} ${JSON.stringify(action.response)}`,
          );
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

- Updated dependencies [[`43a955c`](https://github.com/reactive/data-client/commit/43a955c18684b4e0f5c1d79b2504e8ad2910816b)]:
  - @data-client/normalizr@0.14.16

## 0.14.13

### Patch Changes

- [`191716f`](https://github.com/reactive/data-client/commit/191716fa120c24bf63b8c960b7d5ee505f5f0fdb) Thanks [@ntucker](https://github.com/ntucker)! - README: Update logo

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Update README to remove Entity.pk() when it is default ('id')

- Updated dependencies [[`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab)]:
  - @data-client/normalizr@0.14.10

## 0.14.8

### Patch Changes

- [`bad1fb9`](https://github.com/reactive/data-client/commit/bad1fb909f8d60f19450bbf40df00d90e03a61c2) Thanks [@ntucker](https://github.com/ntucker)! - Update package description

## 0.14.6

### Patch Changes

- [#3165](https://github.com/reactive/data-client/pull/3165) [`3fa9eb9`](https://github.com/reactive/data-client/commit/3fa9eb907d8760171da065168796b87e802d6666) Thanks [@ntucker](https://github.com/ntucker)! - [Query](https://dataclient.io/rest/api/Query) can take [Object Schemas](https://dataclient.io/rest/api/Object)

  This enables joining arbitrary objects (whose pk works with the same arguments.)

  ```ts
  class Ticker extends Entity {
    product_id = '';
    price = 0;

    pk(): string {
      return this.product_id;
    }
  }
  class Stats extends Entity {
    product_id = '';
    last = 0;

    pk(): string {
      return this.product_id;
    }
  }
  const queryPrice = new schema.Query(
    { ticker: Ticker, stats: Stats },
    ({ ticker, stats }) => ticker?.price ?? stats?.last,
  );
  ```

- Updated dependencies [[`3fa9eb9`](https://github.com/reactive/data-client/commit/3fa9eb907d8760171da065168796b87e802d6666)]:
  - @data-client/normalizr@0.14.6

## 0.14.5

### Patch Changes

- [#3164](https://github.com/reactive/data-client/pull/3164) [`ffea6fc`](https://github.com/reactive/data-client/commit/ffea6fcfe142e966d1b9527bf2505a5695b98300) Thanks [@ntucker](https://github.com/ntucker)! - Manager.getMiddleware() -> Manager.middleware

  `getMiddleware()` is still supported to make this change non-breaking

- [`82fbb85`](https://github.com/reactive/data-client/commit/82fbb8595d3bec835b3cd4a41f154b7935ccaee2) Thanks [@ntucker](https://github.com/ntucker)! - Middleware types include union of possible actions

- [`262587c`](https://github.com/reactive/data-client/commit/262587c0c3e4bc8b779b1ff22ac84d4bddddf5bc) Thanks [@ntucker](https://github.com/ntucker)! - Add SchemaClass type export

## 0.14.4

### Patch Changes

- [#3161](https://github.com/reactive/data-client/pull/3161) [`b932dca`](https://github.com/reactive/data-client/commit/b932dca45a4fcf60c00db8da509162f253065769) Thanks [@ntucker](https://github.com/ntucker)! - Add jsdocs to IdlingNetworkManager

- [`e4751d9`](https://github.com/reactive/data-client/commit/e4751d9cd0ee26567d7632ea4707ca181901ff89) Thanks [@ntucker](https://github.com/ntucker)! - NetworkManager constructor uses keyword args

  #### Before

  ```ts
  new NetworkManager(42, 7);
  ```

  #### After

  ```ts
  new NetworkManager({ dataExpiryLength: 42, errorExpiryLength: 7 });
  ```

- [`09ad848`](https://github.com/reactive/data-client/commit/09ad848879db55bb441d93336dd7442d3f484d49) Thanks [@ntucker](https://github.com/ntucker)! - state.endpoints moved above indexes

  `entites` and `endpoints` are the most commonly inspected
  parts of state when debugging, so it is better to have endpoints
  above indexes.

## 0.14.2

### Patch Changes

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - Disable devtools dispatch feature as it is not usable

- [`d8666bf`](https://github.com/reactive/data-client/commit/d8666bf9e059a24b35c8f22b7525ce55c23c84f3) Thanks [@ntucker](https://github.com/ntucker)! - Minor store creation optimizations

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - fix: Devtools correctly logs fetch actions

  We inspect fetches against inflight to see if they are throttled;
  However, we previously did this after we sent the action to NetworkManager, which
  meant it would also skip logging any throttlable fetches - even if they were not throttled.

- [`d84b43c`](https://github.com/reactive/data-client/commit/d84b43cf728d714da7182f2c19b39f49e0ec0366) Thanks [@ntucker](https://github.com/ntucker)! - Move NetworkManager missing detection to initialization (applyManager())

- [`06df291`](https://github.com/reactive/data-client/commit/06df291a1f1d91afa331310dfb8319bc8d1a3ba8) Thanks [@ntucker](https://github.com/ntucker)! - Reorder action members for easier debuggability
  - `key` at top - easiest to read 'subject'
  - `response` or `value` after - 'object' being set

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - Improve typing for devtools options

## 0.14.1

### Patch Changes

- [`7427519`](https://github.com/reactive/data-client/commit/742751933f799c77b12cec7f8a7e4582db4cd779) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- Updated dependencies [[`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f)]:
  - @data-client/normalizr@0.14.1

## 0.14.0

### Minor Changes

- [#3141](https://github.com/reactive/data-client/pull/3141) [`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: setResponseAction.payload -> setResponseAction.response

  This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
  handle [SET_RESPONSE](/docs/api/Actions#set_response).

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

- [`96f7eb0`](https://github.com/reactive/data-client/commit/96f7eb0c97db75bd0ec663d0fb0db8cf3ee808d5) Thanks [@ntucker](https://github.com/ntucker)! - Renamed FETCH action.meta.createdAt to fetchedAt to be consistent with other actions like
  SET_RESPONSE.

  BREAKING CHANGE: fetchAction.meta.createdAt -> fetchAction.meta.fetchedAt

- [#3138](https://github.com/reactive/data-client/pull/3138) [`ee509fb`](https://github.com/reactive/data-client/commit/ee509fb9c7681f060521f358f76b55ca0cb600ec) Thanks [@ntucker](https://github.com/ntucker)! - Remove throttle from FETCH_TYPE action

  BREAKING CHANGE: action.meta.throttle -> !action.endpoint.sideEffect

- [#3143](https://github.com/reactive/data-client/pull/3143) [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716) Thanks [@ntucker](https://github.com/ntucker)! - action.meta.args -> action.args

- [#3143](https://github.com/reactive/data-client/pull/3143) [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716) Thanks [@ntucker](https://github.com/ntucker)! - Add `actions` export

  `actions` is a namespace for all action creators. It is typically
  preferred to use [Controller's](https://dataclient.io/docs/api/Controller) type-safe dispatch methods, as
  members of this namespace could have breaking changes in a minor release.

  ```ts
  import { actions, type Manager, type Middleware } from '@data-client/core';

  export default class MyManager implements Manager {
    getMiddleware = (): Middleware => controller => next => {
      const todo = { id: '5', title: 'my first todo' };

      // These do the same thing
      controller.dispatch(
        actions.createSet(Todo, { args: [{ id: todo.id }], value: todo }),
      );
      // This is simpler; type-enforced; and will only change in major versions
      controller.set(Todo, { id: todo.id }, todo);

      return async action => next(action);
    };

    cleanup() {}
  }
  ```

  BREAKING CHANGE: Removed `createFetch`, `createSet`, `createSetResponse` from export. Use action.createFetch instead.

- [#3141](https://github.com/reactive/data-client/pull/3141) [`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: remove fetchAction.payload

  This only affects those writing custom [Managers](https://dataclient.io/docs/concepts/managers) that
  handle [FETCH](/docs/api/Actions#fetch).

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
          action.payload().then(response => console.log(response));
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
            .then(response => console.log(response));
        default:
          return next(action);
      }
    };

    cleanup() {}
  }
  ```

- [#3143](https://github.com/reactive/data-client/pull/3143) [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716) Thanks [@ntucker](https://github.com/ntucker)! - action.meta.key -> action.key

- [#3139](https://github.com/reactive/data-client/pull/3139) [`9df0f7c`](https://github.com/reactive/data-client/commit/9df0f7c670c919d956312d2535c298d2553f5840) Thanks [@ntucker](https://github.com/ntucker)! - Get rid of fetch action.meta.nm. This is not used anywhere.

### Patch Changes

- [`3ffa454`](https://github.com/reactive/data-client/commit/3ffa454def38b35a23520444f80b307732a8a89b) Thanks [@ntucker](https://github.com/ntucker)! - internal: Simplify fetchReducer code

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.normalize `visit()` interface; removing non-contextual arguments.

  ```ts
  /** Visits next data + schema while recurisvely normalizing */
  export interface Visit {
    (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
    creating?: boolean;
  }
  ```

  This results in a 10% normalize performance boost.

  ```ts title="Before"
  processedEntity[key] = visit(
    processedEntity[key],
    processedEntity,
    key,
    this.schema[key],
    addEntity,
    visitedEntities,
    storeEntities,
    args,
  );
  ```

  ```ts title="After"
  processedEntity[key] = visit(
    this.schema[key],
    processedEntity[key],
    processedEntity,
    key,
    args,
  );
  ```

  The information needed from these arguments are provided by [closing](<https://en.wikipedia.org/wiki/Closure_(computer_programming)>) `visit()` around them.

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.normalize interface from direct data access, to using functions like `getEntity`

  ```ts
  interface SchemaSimple {
    normalize(
      input: any,
      parent: any,
      key: any,
      args: any[],
      visit: (
        schema: any,
        value: any,
        parent: any,
        key: any,
        args: readonly any[],
      ) => any,
      addEntity: (...args: any) => any,
      getEntity: (...args: any) => any,
      checkLoop: (...args: any) => any,
    ): any;
  }
  ```

  We also add `checkLoop()`, which moves some logic in [Entity](https://dataclient.io/rest/api/Entity)
  to the core normalize algorithm.

  ```ts
  /** Returns true if a circular reference is found */
  export interface CheckLoop {
    (entityKey: string, pk: string, input: object): boolean;
  }
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.denormalize `unvisit` to have [schema](https://dataclient.io/rest/api/schema) argument first.

  ```ts
  interface SchemaSimple {
    denormalize(
      input: {},
      args: readonly any[],
      unvisit: (schema: any, input: any) => any,
    ): T;
  }
  ```

- Updated dependencies [[`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36)]:
  - @data-client/normalizr@0.14.0

## 0.13.5

### Patch Changes

- [#3129](https://github.com/reactive/data-client/pull/3129) [`2503402`](https://github.com/reactive/data-client/commit/2503402c28a51b2a686bf61132b74d673950e63e) Thanks [@ntucker](https://github.com/ntucker)! - Allow ctrl.set() value to be a function

  This [prevents race conditions](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

  ```ts
  const id = '2';
  ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
  ```

  Note: the response must include values sufficient to compute Entity.pk()

- [#3127](https://github.com/reactive/data-client/pull/3127) [`c18fbf7`](https://github.com/reactive/data-client/commit/c18fbf7fdc7c421d15dc26cc5add3b5840ddca6d) Thanks [@ntucker](https://github.com/ntucker)! - Remove RIC export

- [#3127](https://github.com/reactive/data-client/pull/3127) [`c18fbf7`](https://github.com/reactive/data-client/commit/c18fbf7fdc7c421d15dc26cc5add3b5840ddca6d) Thanks [@ntucker](https://github.com/ntucker)! - Add NetworkManager.idleCallback overridable method

  This allows platform specific implementations by overriding the method.
  For instance, on web:

  ```ts
  import { NetworkManager } from '@data-client/core';

  export default class WebNetworkManager extends NetworkManager {
    static {
      if (typeof requestIdleCallback === 'function') {
        WebNetworkManager.prototype.idleCallback = requestIdleCallback;
      }
    }
  }
  ```

## 0.13.1

### Patch Changes

- [`327d666`](https://github.com/reactive/data-client/commit/327d6668958e45119eb075f6af4de7239fc1dda6) Thanks [@ntucker](https://github.com/ntucker)! - Add ctrl.set() to README

## 0.13.0

### Minor Changes

- [#3105](https://github.com/reactive/data-client/pull/3105) [`cf770de`](https://github.com/reactive/data-client/commit/cf770de244ad890b286c59ac305ceb6c3b1288ea) Thanks [@ntucker](https://github.com/ntucker)! - Add controller.set()

  ```ts
  ctrl.set(
    Todo,
    { id: '5' },
    { id: '5', title: 'tell me friends how great Data Client is' },
  );
  ```

  BREAKING CHANGE:
  - actionTypes.SET_TYPE -> actionTypes.SET_RESPONSE_TYPE
  - SetAction -> SetResponseAction

## 0.12.5

### Patch Changes

- [`e4d5f01`](https://github.com/reactive/data-client/commit/e4d5f019f7c3817fb740094244e8ce17ccd5452d) Thanks [@ntucker](https://github.com/ntucker)! - [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager) uses [maxAge](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage) to set buffer size

- [`c3481ad`](https://github.com/reactive/data-client/commit/c3481ad578c77a6dc73f45f1afcec353ba032534) Thanks [@ntucker](https://github.com/ntucker)! - Fix DevToolsManager() config parameter correctly sets devtools config

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

- [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259) Thanks [@ntucker](https://github.com/ntucker)! - Reduce GC pressure by reusing AbortOptimistic instance

- Updated dependencies [[`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d)]:
  - @data-client/normalizr@0.12.3

## 0.12.1

### Patch Changes

- [#3043](https://github.com/reactive/data-client/pull/3043) [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c) Thanks [@ntucker](https://github.com/ntucker)! - Improve [controller](https://dataclient.io/docs/api/Controller) type matching for its methods

## 0.11.5

### Patch Changes

- [#3033](https://github.com/reactive/data-client/pull/3033) [`2152b41`](https://github.com/reactive/data-client/commit/2152b41afc56027175bd36e7ef89c433a2e5e025) Thanks [@ntucker](https://github.com/ntucker)! - Environments without RequestIdleCallback will call immediately

## 0.11.4

### Patch Changes

- [#3020](https://github.com/reactive/data-client/pull/3020) [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d) Thanks [@ntucker](https://github.com/ntucker)! - Add NI<> utility type that is back-compat NoInfer<>

- Updated dependencies [[`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d)]:
  - @data-client/normalizr@0.11.4

## 0.11.0

[Release notes and migration guide](https://dataclient.io/blog/2024/04/08/v0.11-queries-querable-usequery)

### Minor Changes

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: new AbortOptimistic() -> [snapshot.abort](https://dataclient/docs/api/Snapshot#abort)

  #### Before

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw new AbortOptimistic();
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

  #### After

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2977](https://github.com/reactive/data-client/pull/2977) [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Schema.infer -> Schema.queryKey

  ```ts title="Before"
  class MyEntity extends Entity {
    // highlight-next-line
    static infer(
      args: readonly any[],
      indexes: NormalizedIndex,
      recurse: any,
      entities: any,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.infer(args, indexes, recurse, entities);
    }
  }
  ```

  ```ts title="After"
  class MyEntity extends Entity {
    // highlight-next-line
    static queryKey(
      args: readonly any[],
      queryKey: (...args: any) => any,
      getEntity: GetEntity,
      getIndex: GetIndex,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.queryKey(args, queryKey, getEntity, getIndex);
    }
  }
  ```

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Add [controller.get](https://dataclient.io/docs/api/Controller#get) / [snapshot.get](https://dataclient.io/docs/api/Snapshot#get) to directly read [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

  #### Before

  ```tsx
  export const PostResource = createResource({
    path: '/posts/:id',
    schema: Post,
  }).extend(Base => ({
    vote: new RestEndpoint({
      path: '/posts/:id/vote',
      method: 'POST',
      body: undefined,
      schema: Post,
      getOptimisticResponse(snapshot, { id }) {
        const { data } = snapshot.getResponse(Base.get, { id });
        if (!data) throw new AbortOptimistic();
        return {
          id,
          votes: data.votes + 1,
        };
      },
    }),
  }));
  ```

  #### After

  ```tsx
  export const PostResource = createResource({
    path: '/posts/:id',
    schema: Post,
  }).extend('vote', {
    path: '/posts/:id/vote',
    method: 'POST',
    body: undefined,
    schema: Post,
    getOptimisticResponse(snapshot, { id }) {
      const post = snapshot.get(Post, { id });
      if (!post) throw new AbortOptimistic();
      return {
        id,
        votes: post.votes + 1,
      };
    },
  });
  ```

- [#2957](https://github.com/reactive/data-client/pull/2957) [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a) Thanks [@ntucker](https://github.com/ntucker)! - Add [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2977](https://github.com/reactive/data-client/pull/2977) [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: inferResults() -> buildQueryKey()

- [#2971](https://github.com/reactive/data-client/pull/2971) [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Internal state.results -> state.endpoints

### Patch Changes

- [`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4) Thanks [@ntucker](https://github.com/ntucker)! - Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds
  - `unvisit()` always returns `undefined` with `undefined` as input.
  - `All` returns INVALID from `queryKey()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)

- [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0) Thanks [@ntucker](https://github.com/ntucker)! - Update description in package.json

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Improve controller.getResponse() type matching

  Uses function overloading to more precisely match argument
  expectations for fetchable Endpoints vs only keyable Endpoints.

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- Updated dependencies [[`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0), [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd), [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`73de27f`](https://github.com/reactive/data-client/commit/73de27fadb214c3c2995ca558daa9736312de7a9), [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1), [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1), [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd), [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd), [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a), [`10432b7`](https://github.com/reactive/data-client/commit/10432b7eeab8f1e31ed764d46b0775e36ea74041), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af)]:
  - @data-client/normalizr@0.11.0

## 0.10.0

### Minor Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object
  - `[]` and [schema.Array](https://dataclient.io/rest/api/Array) now behave in the same manner.
  - `null` values are now consistently handled everywhere (being retained).
    - These were already being retained in [nested Entities](https://dataclient.io/rest/guides/relational-data#nesting)
  - `undefined` is still filtered out.

### Patch Changes

- [`4e6a39e`](https://github.com/reactive/data-client/commit/4e6a39ea2bfdb1390051f12781e899488609e1a8) Thanks [@ntucker](https://github.com/ntucker)! - Limit DevToolsManager action buffer depth to 100

  This will avoid memory leaks in long running applications, or ones with frequent updates.

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`67f4e0b`](https://github.com/reactive/data-client/commit/67f4e0b45068da32d20e250267cb1cd2cea51226), [`053e823`](https://github.com/reactive/data-client/commit/053e82377bd29f200cd7dfbc700da7a3ad7fa8d7), [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474)]:
  - @data-client/normalizr@0.10.0

## 0.9.7

### Patch Changes

- [`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62) Thanks [@ntucker](https://github.com/ntucker)! - docs: README uses svg version of logo

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
