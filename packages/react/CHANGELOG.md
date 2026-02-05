# @data-client/react

## 0.15.6

### Patch Changes

- [#3718](https://github.com/reactive/data-client/pull/3718) [`c7f8c79`](https://github.com/reactive/data-client/commit/c7f8c79bc2399ec8183196ce3680ed88c4ca9864) Thanks [@ntucker](https://github.com/ntucker)! - Remove misleading 'Uncaught Suspense' warning in SSRDataProvider

  The SSRDataProvider now uses `null` instead of `BackupLoading` as the Suspense fallback. This prevents the confusing "Uncaught Suspense" development warning from appearing during normal Next.js server-side rendering, where suspense is expected behavior.

- [`ad501b6`](https://github.com/reactive/data-client/commit/ad501b62ec231ff771da05d32053934960c8800c) Thanks [@ntucker](https://github.com/ntucker)! - Add skill reference to readme

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

- Updated dependencies [[`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57), [`09056b0`](https://github.com/reactive/data-client/commit/09056b0adf1375e0aa17df6c1db6f73f721c518f)]:
  - @data-client/core@0.15.4

## 0.15.3

### Patch Changes

- [#3691](https://github.com/reactive/data-client/pull/3691) [`bf3ac79`](https://github.com/reactive/data-client/commit/bf3ac7966dc615b1dc6cc6c6d600148fdca4e354) Thanks [@ntucker](https://github.com/ntucker)! - Fix CommonJS compatibility for `/mock` subpath exports.

  Jest and other CommonJS consumers can now import from `@data-client/react/mock` and `@data-client/core/mock` without ESM parsing errors.

- [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133) Thanks [@ntucker](https://github.com/ntucker)! - Fix image links in package README

- Updated dependencies [[`bf3ac79`](https://github.com/reactive/data-client/commit/bf3ac7966dc615b1dc6cc6c6d600148fdca4e354), [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133)]:
  - @data-client/core@0.15.3

## 0.15.0

### Minor Changes

- [#3459](https://github.com/reactive/data-client/pull/3459) [`997ca20`](https://github.com/reactive/data-client/commit/997ca209d36e8503ab7684bccc6ddc29d179a0b5) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: useDebounce() returns [val, isPending]

  This was previously exported in `@data-client/react/next` to make migrations easy. This will
  still be available there.

  #### Before

  ```ts
  import { useDebounce } from '@data-client/react';
  const debouncedQuery = useDebounce(query, 100);
  ```

  #### After

  ```ts
  import { useDebounce } from '@data-client/react';
  const [debouncedQuery] = useDebounce(query, 100);
  ```

  #### Before

  ```ts
  import { useDebounce } from '@data-client/react/next';
  const [debouncedQuery, isPending] = useDebounce(query, 100);
  ```

  #### After

  ```ts
  import { useDebounce } from '@data-client/react';
  const [debouncedQuery, isPending] = useDebounce(query, 100);
  ```

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

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - Fix controller.get and controller.getQueryMeta 'state' argument types

- [#3684](https://github.com/reactive/data-client/pull/3684) [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f) Thanks [@ntucker](https://github.com/ntucker)! - Optimize normalization performance with faster loops and Set-based cycle detection

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

- [`35552c7`](https://github.com/reactive/data-client/commit/35552c716e3b688d69212654f9f95a05ea26a7f8) Thanks [@ntucker](https://github.com/ntucker)! - Include GPT link badge in readme

- Updated dependencies [[`a4092a1`](https://github.com/reactive/data-client/commit/a4092a14999bfe3aa5cf613bb009264ec723ff99), [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`d44d36a`](https://github.com/reactive/data-client/commit/d44d36a7de0a18817486c4f723bf2f0e86ac9677), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7)]:
  - @data-client/core@0.15.0

## 0.14.25

### Patch Changes

- [#3398](https://github.com/reactive/data-client/pull/3398) [`d716159`](https://github.com/reactive/data-client/commit/d716159634a067790cd330c4a8c1660fe5f92973) Thanks [@ntucker](https://github.com/ntucker)! - Use controller.getResponseMeta() in hooks

  No behavior change, just anticipating API updates to controller

- [`d6eab29`](https://github.com/reactive/data-client/commit/d6eab2993c3da86d06753cbb50caebc5e19309e2) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add links to platforms

## 0.14.24

### Patch Changes

- [`d41f658`](https://github.com/reactive/data-client/commit/d41f6582478f9392bcbcbcc1213f7a2d9646e9c4) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys [#3390](https://github.com/reactive/data-client/pull/3390)

- Updated dependencies [[`d41f658`](https://github.com/reactive/data-client/commit/d41f6582478f9392bcbcbcc1213f7a2d9646e9c4)]:
  - @data-client/core@0.14.24

## 0.14.23

### Patch Changes

- [`9bf7e7a`](https://github.com/reactive/data-client/commit/9bf7e7ab783eda767dd9f17bbf65c4b85c05d522) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys [#3390](https://github.com/reactive/data-client/pull/3390)

- Updated dependencies [[`9bf7e7a`](https://github.com/reactive/data-client/commit/9bf7e7ab783eda767dd9f17bbf65c4b85c05d522)]:
  - @data-client/core@0.14.23

## 0.14.21

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

- Updated dependencies [[`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3)]:
  - @data-client/use-enhanced-reducer@0.1.14
  - @data-client/core@0.14.21

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

- Updated dependencies [[`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de)]:
  - @data-client/use-enhanced-reducer@0.1.13
  - @data-client/core@0.14.20

## 0.14.19

### Patch Changes

- [#3343](https://github.com/reactive/data-client/pull/3343) [`1df829e`](https://github.com/reactive/data-client/commit/1df829e0a005f5973d59669aaf0a226250346a40) Thanks [@ntucker](https://github.com/ntucker)! - Add gcPolicy option to [DataProvider](https://dataclient.io/docs/api/DataProvider) and [prepareStore](https://dataclient.io/docs/guides/redux)

  ```tsx
  // run GC sweep every 10min
  <DataProvider gcPolicy={new GCPolicy({ intervalMS: 60 * 1000 * 10 })}>
    {children}
  </DataProvider>
  ```

  ```ts
  const { store, selector, controller } = prepareStore(
    initialState,
    managers,
    Controller,
    otherReducers,
    extraMiddlewares,
    gcPolicy: new GCPolicy({ intervalMS: 60 * 1000 * 10 }),
  );
  ```

  To maintain existing behavior, use `ImmortalGCPolicy`:

  ```tsx
  import { ImmortalGCPolicy, DataProvider } from '@data-client/react';

  <DataProvider gcPolicy={new ImmortalGCPolicy()}>{children}</DataProvider>;
  ```

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

- [`12bb010`](https://github.com/reactive/data-client/commit/12bb01084fa21f4c9e83d8daaa9b4c64e205546d) Thanks [@ntucker](https://github.com/ntucker)! - Update async boundary link in BackupLoading component

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

- Updated dependencies [[`1df829e`](https://github.com/reactive/data-client/commit/1df829e0a005f5973d59669aaf0a226250346a40), [`f796b6c`](https://github.com/reactive/data-client/commit/f796b6cbd33cce1f258bd5e95a7d6b1d51365f2f), [`f796b6c`](https://github.com/reactive/data-client/commit/f796b6cbd33cce1f258bd5e95a7d6b1d51365f2f), [`66e7336`](https://github.com/reactive/data-client/commit/66e7336bab0f6768d93c76882188894d36f84f88), [`1df829e`](https://github.com/reactive/data-client/commit/1df829e0a005f5973d59669aaf0a226250346a40), [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6), [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6)]:
  - @data-client/core@0.14.19
  - @data-client/use-enhanced-reducer@0.1.12

## 0.14.18

### Patch Changes

- [`3906fc2`](https://github.com/reactive/data-client/commit/3906fc2fec2b958a44d718934919b524e851f298) Thanks [@ntucker](https://github.com/ntucker)! - SUBSCRIBE action field ordering consistent with other actions

- [`19d4669`](https://github.com/reactive/data-client/commit/19d46699fa9c50ab56b1f4e2c5bafc390ffe6331) Thanks [@ntucker](https://github.com/ntucker)! - Fix pnp compatibility

  Change import from @data-client/normalizr -> @data-client/core
  as `core` is explicit dependency

- Updated dependencies [[`3906fc2`](https://github.com/reactive/data-client/commit/3906fc2fec2b958a44d718934919b524e851f298)]:
  - @data-client/core@0.14.18

## 0.14.17

### Patch Changes

- [`25be07f`](https://github.com/reactive/data-client/commit/25be07f51c501003330d758993542bee3bd804e1) Thanks [@ntucker](https://github.com/ntucker)! - Update README to not say 'mixin' twice

- [`4095003`](https://github.com/reactive/data-client/commit/4095003f40f4f6436a790d108ee13bcae1a2cdfa) Thanks [@ntucker](https://github.com/ntucker)! - Improve compatibility with React 19

- Updated dependencies [[`4095003`](https://github.com/reactive/data-client/commit/4095003f40f4f6436a790d108ee13bcae1a2cdfa)]:
  - @data-client/use-enhanced-reducer@0.1.11

## 0.14.16

### Patch Changes

- [#3238](https://github.com/reactive/data-client/pull/3238) [`28b702d`](https://github.com/reactive/data-client/commit/28b702d39d90cb36c93fe32d00548f2aea9dc58d) Thanks [@ntucker](https://github.com/ntucker)! - Update test docs link

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

- Updated dependencies [[`109c922`](https://github.com/reactive/data-client/commit/109c922919ef401dee3c3c34d705819271f9e140)]:
  - @data-client/core@0.14.16

## 0.14.14

### Patch Changes

- [#3220](https://github.com/reactive/data-client/pull/3220) [`13f02d3`](https://github.com/reactive/data-client/commit/13f02d3cf546cc43ca3fb04656859f33e4cf3274) Thanks [@ntucker](https://github.com/ntucker)! - New [useDebounce()](https://dataclient.io/docs/api/useDebounce) in /next that integrates useTransition()

  ```ts
  import { useDebounce } from '@data-client/react/next';
  const [debouncedQuery, isPending] = useDebounce(query, 100);
  ```

  - Returns tuple - to include isPending
  - Any Suspense triggered due to value change will continue showing
    the previous contents until it is finished loading.

## 0.14.12

### Patch Changes

- [#3202](https://github.com/reactive/data-client/pull/3202) [`1ce07be`](https://github.com/reactive/data-client/commit/1ce07be35f52dc51f3d3ee8ff1db5f0ebb15d058) Thanks [@renovate](https://github.com/apps/renovate)! - fix: ExternalDataProvider correctly tracks unmounting

## 0.14.11

### Patch Changes

- [`709cc7b`](https://github.com/reactive/data-client/commit/709cc7b8df7e85a85842452f11e3d91b705dc7f1) Thanks [@ntucker](https://github.com/ntucker)! - Update hooks docstrings

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Update README to remove Entity.pk() when it is default ('id')

- Updated dependencies [[`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab)]:
  - @data-client/core@0.14.10

## 0.14.9

### Patch Changes

- [`c263931`](https://github.com/reactive/data-client/commit/c26393176518550a16a2e71aea55a8379f30385e) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- [`688c7c6`](https://github.com/reactive/data-client/commit/688c7c67bc6dda329389cb66f9635b88cc51dce3) Thanks [@ntucker](https://github.com/ntucker)! - Use light-mode README header image since npm only has light-mode

## 0.14.8

### Patch Changes

- [`bad1fb9`](https://github.com/reactive/data-client/commit/bad1fb909f8d60f19450bbf40df00d90e03a61c2) Thanks [@ntucker](https://github.com/ntucker)! - Update package description

- Updated dependencies [[`bad1fb9`](https://github.com/reactive/data-client/commit/bad1fb909f8d60f19450bbf40df00d90e03a61c2)]:
  - @data-client/core@0.14.8

## 0.14.7

### Patch Changes

- [`aa4dac5`](https://github.com/reactive/data-client/commit/aa4dac53f184ffe7f4cdd07b5e856b6c92d44d5c) Thanks [@ntucker](https://github.com/ntucker)! - useCache() logic simplification (no real change)

- [`0fac3ce`](https://github.com/reactive/data-client/commit/0fac3ceb7d90c00437a00c7cc9622a821f815ef0) Thanks [@ntucker](https://github.com/ntucker)! - useDLE() deps list more specific to avoid extraneous re-computation

- [`8f827cf`](https://github.com/reactive/data-client/commit/8f827cf64d4938f8c04b75cfaef9740ce7228244) Thanks [@ntucker](https://github.com/ntucker)! - Don't refetch if controller changes (should never happen)

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
  - @data-client/core@0.14.6

## 0.14.5

### Patch Changes

- [`262587c`](https://github.com/reactive/data-client/commit/262587c0c3e4bc8b779b1ff22ac84d4bddddf5bc) Thanks [@ntucker](https://github.com/ntucker)! - export EntityInterface, Queryable

- [#3164](https://github.com/reactive/data-client/pull/3164) [`ffea6fc`](https://github.com/reactive/data-client/commit/ffea6fcfe142e966d1b9527bf2505a5695b98300) Thanks [@ntucker](https://github.com/ntucker)! - Manager.getMiddleware() -> Manager.middleware

  `getMiddleware()` is still supported to make this change non-breaking

- [#3164](https://github.com/reactive/data-client/pull/3164) [`ffea6fc`](https://github.com/reactive/data-client/commit/ffea6fcfe142e966d1b9527bf2505a5695b98300) Thanks [@ntucker](https://github.com/ntucker)! - Move manager lifecycle logic from DataStore to DataProvider

  This has no behavioral change, but creates a better seperation of concerns.

- [`82fbb85`](https://github.com/reactive/data-client/commit/82fbb8595d3bec835b3cd4a41f154b7935ccaee2) Thanks [@ntucker](https://github.com/ntucker)! - Middleware types include union of possible actions

- [`8287f48`](https://github.com/reactive/data-client/commit/8287f48daedb82c5be3cb4c7ece0326ef076dee4) Thanks [@ntucker](https://github.com/ntucker)! - README: Update manager stream example link

- [`262587c`](https://github.com/reactive/data-client/commit/262587c0c3e4bc8b779b1ff22ac84d4bddddf5bc) Thanks [@ntucker](https://github.com/ntucker)! - Add SchemaClass type export

- Updated dependencies [[`ffea6fc`](https://github.com/reactive/data-client/commit/ffea6fcfe142e966d1b9527bf2505a5695b98300), [`82fbb85`](https://github.com/reactive/data-client/commit/82fbb8595d3bec835b3cd4a41f154b7935ccaee2), [`262587c`](https://github.com/reactive/data-client/commit/262587c0c3e4bc8b779b1ff22ac84d4bddddf5bc)]:
  - @data-client/core@0.14.5

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

- [`0adad92`](https://github.com/reactive/data-client/commit/0adad9209265c388eb6d334afe681610bccfb877) Thanks [@ntucker](https://github.com/ntucker)! - Update debugging link

- [`09ad848`](https://github.com/reactive/data-client/commit/09ad848879db55bb441d93336dd7442d3f484d49) Thanks [@ntucker](https://github.com/ntucker)! - state.endpoints moved above indexes

  `entites` and `endpoints` are the most commonly inspected
  parts of state when debugging, so it is better to have endpoints
  above indexes.

- [#3161](https://github.com/reactive/data-client/pull/3161) [`b932dca`](https://github.com/reactive/data-client/commit/b932dca45a4fcf60c00db8da509162f253065769) Thanks [@ntucker](https://github.com/ntucker)! - Add configuration to [getDefaultManagers()](https://dataclient.io/docs/api/getDefaultManagers)

  ```ts
  // completely remove DevToolsManager
  const managers = getDefaultManagers({ devToolsManager: null });
  ```

  ```ts
  // easier configuration
  const managers = getDefaultManagers({
    devToolsManager: {
      // double latency to help with high frequency updates
      latency: 1000,
      // skip websocket updates as these are too spammy
      predicate: (state, action) =>
        action.type !== actionTypes.SET_TYPE || action.schema !== Ticker,
    },
  });
  ```

  ```ts
  // passing instance allows us to use custom classes as well
  const managers = getDefaultManagers({
    networkManager: new CustomNetworkManager(),
  });
  ```

- Updated dependencies [[`b932dca`](https://github.com/reactive/data-client/commit/b932dca45a4fcf60c00db8da509162f253065769), [`e4751d9`](https://github.com/reactive/data-client/commit/e4751d9cd0ee26567d7632ea4707ca181901ff89), [`09ad848`](https://github.com/reactive/data-client/commit/09ad848879db55bb441d93336dd7442d3f484d49)]:
  - @data-client/core@0.14.4

## 0.14.2

### Patch Changes

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - Disable devtools dispatch feature as it is not usable

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - fix: Devtools correctly logs fetch actions

  We inspect fetches against inflight to see if they are throttled;
  However, we previously did this after we sent the action to NetworkManager, which
  meant it would also skip logging any throttlable fetches - even if they were not throttled.

- [`d84b43c`](https://github.com/reactive/data-client/commit/d84b43cf728d714da7182f2c19b39f49e0ec0366) Thanks [@ntucker](https://github.com/ntucker)! - Move NetworkManager missing detection to initialization (applyManager())

- [`06df291`](https://github.com/reactive/data-client/commit/06df291a1f1d91afa331310dfb8319bc8d1a3ba8) Thanks [@ntucker](https://github.com/ntucker)! - Reorder action members for easier debuggability
  - `key` at top - easiest to read 'subject'
  - `response` or `value` after - 'object' being set

- [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e) Thanks [@ntucker](https://github.com/ntucker)! - Improve typing for devtools options

- Updated dependencies [[`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e), [`d8666bf`](https://github.com/reactive/data-client/commit/d8666bf9e059a24b35c8f22b7525ce55c23c84f3), [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e), [`d84b43c`](https://github.com/reactive/data-client/commit/d84b43cf728d714da7182f2c19b39f49e0ec0366), [`06df291`](https://github.com/reactive/data-client/commit/06df291a1f1d91afa331310dfb8319bc8d1a3ba8), [`597a1b2`](https://github.com/reactive/data-client/commit/597a1b228c81940bdbaf15900ab1e624be3f520e)]:
  - @data-client/core@0.14.2

## 0.14.1

### Patch Changes

- [`7427519`](https://github.com/reactive/data-client/commit/742751933f799c77b12cec7f8a7e4582db4cd779) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- Updated dependencies [[`7427519`](https://github.com/reactive/data-client/commit/742751933f799c77b12cec7f8a7e4582db4cd779)]:
  - @data-client/core@0.14.1

## 0.14.0

### Minor Changes

- [#3146](https://github.com/reactive/data-client/pull/3146) [`6325384`](https://github.com/reactive/data-client/commit/632538421bf21440a12bb32cb3c8cccd3a5c4cbb) Thanks [@ntucker](https://github.com/ntucker)! - Call fetches immediately - do not wait for idle

  [NetworkManager](https://dataclient.io/docs/api/NetworkManager) will fetch
  immediately, rather than waiting for idle. With React 18+ it is expected for
  React to better handle work with concurrent mode and batching. Due to this, it
  is not longer deemed the best performance to wait for idle and instead we should
  fetch immediately.

  `IdlingNetworkManager` is still available to keep the previous behavior.

### Patch Changes

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

- [#3143](https://github.com/reactive/data-client/pull/3143) [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716) Thanks [@ntucker](https://github.com/ntucker)! - action.meta.args -> action.args

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

- [`8aabe18`](https://github.com/reactive/data-client/commit/8aabe189330bdef2f36dd2c76c9e0ff80659468b) Thanks [@ntucker](https://github.com/ntucker)! - More robust requestIdleCallback wrapper

- [#3143](https://github.com/reactive/data-client/pull/3143) [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716) Thanks [@ntucker](https://github.com/ntucker)! - action.meta.key -> action.key

- [#3139](https://github.com/reactive/data-client/pull/3139) [`9df0f7c`](https://github.com/reactive/data-client/commit/9df0f7c670c919d956312d2535c298d2553f5840) Thanks [@ntucker](https://github.com/ntucker)! - Get rid of fetch action.meta.nm. This is not used anywhere.

- Updated dependencies [[`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1), [`96f7eb0`](https://github.com/reactive/data-client/commit/96f7eb0c97db75bd0ec663d0fb0db8cf3ee808d5), [`3ffa454`](https://github.com/reactive/data-client/commit/3ffa454def38b35a23520444f80b307732a8a89b), [`ee509fb`](https://github.com/reactive/data-client/commit/ee509fb9c7681f060521f358f76b55ca0cb600ec), [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716), [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`d225595`](https://github.com/reactive/data-client/commit/d2255959489b71cfdfcaf4be72fd272231d392f1), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`f4cf8a4`](https://github.com/reactive/data-client/commit/f4cf8a4df3dfe852d98058abd06178f751ae8716), [`9df0f7c`](https://github.com/reactive/data-client/commit/9df0f7c670c919d956312d2535c298d2553f5840)]:
  - @data-client/core@0.14.0

## 0.13.6

### Patch Changes

- [`bfd86dc`](https://github.com/reactive/data-client/commit/bfd86dc58735c6f1041878714c1d5afa5db60143) Thanks [@ntucker](https://github.com/ntucker)! - Fix fetch calls on web

## 0.13.5

### Patch Changes

- [#3129](https://github.com/reactive/data-client/pull/3129) [`2503402`](https://github.com/reactive/data-client/commit/2503402c28a51b2a686bf61132b74d673950e63e) Thanks [@ntucker](https://github.com/ntucker)! - Allow ctrl.set() value to be a function

  This [prevents race conditions](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

  ```ts
  const id = '2';
  ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
  ```

  Note: the response must include values sufficient to compute Entity.pk()

- [#3127](https://github.com/reactive/data-client/pull/3127) [`c18fbf7`](https://github.com/reactive/data-client/commit/c18fbf7fdc7c421d15dc26cc5add3b5840ddca6d) Thanks [@ntucker](https://github.com/ntucker)! - React Native calls fetches in InteractionManager.runAfterInteractions callback

  This reduces the chance of frame drops.

- Updated dependencies [[`2503402`](https://github.com/reactive/data-client/commit/2503402c28a51b2a686bf61132b74d673950e63e), [`c18fbf7`](https://github.com/reactive/data-client/commit/c18fbf7fdc7c421d15dc26cc5add3b5840ddca6d), [`c18fbf7`](https://github.com/reactive/data-client/commit/c18fbf7fdc7c421d15dc26cc5add3b5840ddca6d)]:
  - @data-client/core@0.13.5

## 0.13.4

### Patch Changes

- [`720ff0c`](https://github.com/reactive/data-client/commit/720ff0c3d833ff4d1eb5020694131e87282b585d) Thanks [@ntucker](https://github.com/ntucker)! - Widen ErrorFallback types

- [`720ff0c`](https://github.com/reactive/data-client/commit/720ff0c3d833ff4d1eb5020694131e87282b585d) Thanks [@ntucker](https://github.com/ntucker)! - Update keywords

- [#3123](https://github.com/reactive/data-client/pull/3123) [`c38714d`](https://github.com/reactive/data-client/commit/c38714ddb42819f2d05e0dda9a19579025600928) Thanks [@ntucker](https://github.com/ntucker)! - Fix React Native use correct native specific modules

  Fully realized path names (including .js at end of import)
  was breaking [platform specific extensions](https://docs.expo.dev/router/advanced/platform-specific-modules/#platform-specific-extensions). To workaround this issue, we
  simply create a custom react-native build that remaps any
  imports with full extension written ("file.native.js")

## 0.13.3

### Patch Changes

- [#3115](https://github.com/reactive/data-client/pull/3115) [`34f12c4`](https://github.com/reactive/data-client/commit/34f12c4022462bea441ec134a61cfcc4cf505e6d) Thanks [@ntucker](https://github.com/ntucker)! - Add [useLoading()](https://dataclient.io/docs/api/useLoading), [useDebounce()](https://dataclient.io/docs/api/useDebounce), [useCancelling()](https://dataclient.io/docs/api/useCancelling)

  These are taken from the hooks package.

- [`47bf5af`](https://github.com/reactive/data-client/commit/47bf5aff1a473f113b14b9c619e838e766c394ce) Thanks [@ntucker](https://github.com/ntucker)! - Fix React Native should not render anything for dev button

## 0.13.2

### Patch Changes

- [`2ba27aa`](https://github.com/reactive/data-client/commit/2ba27aab7b582a7dabf460acbe2cd5c05e02be9a) Thanks [@ntucker](https://github.com/ntucker)! - Fix NextJS DataProvider hydration with no managers prop

## 0.13.1

### Patch Changes

- [`96b683b`](https://github.com/reactive/data-client/commit/96b683bea7e5a71bdfe40913f8ec21969e2d43e0) Thanks [@ntucker](https://github.com/ntucker)! - Remove need for dispatch in StoreContext as it is never used

  This should have no affect unless you're working with internals of Data Client

- [`4d8a8a5`](https://github.com/reactive/data-client/commit/4d8a8a5f5f6e68dfc1d7055db528911b7650ae0f) Thanks [@ntucker](https://github.com/ntucker)! - Fix SSR hydration when removing devtools manager

- [#3112](https://github.com/reactive/data-client/pull/3112) [`afe0640`](https://github.com/reactive/data-client/commit/afe0640f47acfe8fc9509b87d49292297726f74d) Thanks [@ntucker](https://github.com/ntucker)! - enhance: Use custom SSRProvider for SSR rather than ExternalDataProvider

- [`327d666`](https://github.com/reactive/data-client/commit/327d6668958e45119eb075f6af4de7239fc1dda6) Thanks [@ntucker](https://github.com/ntucker)! - Add ctrl.set() to README

- Updated dependencies [[`327d666`](https://github.com/reactive/data-client/commit/327d6668958e45119eb075f6af4de7239fc1dda6)]:
  - @data-client/core@0.13.1

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

### Patch Changes

- Updated dependencies [[`cf770de`](https://github.com/reactive/data-client/commit/cf770de244ad890b286c59ac305ceb6c3b1288ea)]:
  - @data-client/core@0.13.0

## 0.12.15

### Patch Changes

- [`233f400`](https://github.com/reactive/data-client/commit/233f400ae72b8a9470454b3f3df2b9e75a9b1a36) Thanks [@ntucker](https://github.com/ntucker)! - Fix commonjs builds to keep same context instance

  There must be only one instance of a context, so we need to ensure our new entrypoints don't include createContext

## 0.12.14

### Patch Changes

- [`d3cdbef`](https://github.com/reactive/data-client/commit/d3cdbef2012e5934594be18822c9af7465019b17) Thanks [@ntucker](https://github.com/ntucker)! - Add commonjs bundle for @data-client/react/ssr

## 0.12.13

### Patch Changes

- [#3099](https://github.com/reactive/data-client/pull/3099) [`428ddd1`](https://github.com/reactive/data-client/commit/428ddd1a185cd5fcc4bb53b2bc64605cca48ba82) Thanks [@ntucker](https://github.com/ntucker)! - Add [@data-client/react/redux](https://dataclient.io/docs/guides/redux)

  ```ts
  import {
    ExternalDataProvider,
    PromiseifyMiddleware,
    applyManager,
    initialState,
    createReducer,
    prepareStore,
  } from '@data-client/react/redux';
  ```

- [`d1b9e96`](https://github.com/reactive/data-client/commit/d1b9e96dffe69527f9ce0ebff4727f0b1226c9d5) Thanks [@ntucker](https://github.com/ntucker)! - Add /ssr entrypoint - eliminating the need for @data-client/ssr package completely

  ```ts
  import {
    createPersistedStore,
    createServerDataComponent,
  } from '@data-client/react/ssr';
  ```

- [#3099](https://github.com/reactive/data-client/pull/3099) [`428ddd1`](https://github.com/reactive/data-client/commit/428ddd1a185cd5fcc4bb53b2bc64605cca48ba82) Thanks [@ntucker](https://github.com/ntucker)! - Add middlewares argument to prepareStore()

  ```tsx title="index.tsx"
  import {
    ExternalDataProvider,
    prepareStore,
    type Middleware,
  } from '@data-client/react/redux';
  import { getDefaultManagers, Controller } from '@data-client/react';
  import ReactDOM from 'react-dom';

  const managers = getDefaultManagers();
  // be sure to include your other reducers here
  const otherReducers = {};
  const extraMiddlewares: Middleware = [];

  const { store, selector, controller } = prepareStore(
    initialState,
    managers,
    Controller,
    otherReducers,
    extraMiddlewares,
  );

  ReactDOM.render(
    <ExternalDataProvider
      store={store}
      selector={selector}
      controller={controller}
    >
      <App />
    </ExternalDataProvider>,
    document.body,
  );
  ```

## 0.12.12

### Patch Changes

- [#3093](https://github.com/reactive/data-client/pull/3093) [`a998a0b`](https://github.com/reactive/data-client/commit/a998a0b31c9e2d008eb678f175a262af561d2b42) Thanks [@ntucker](https://github.com/ntucker)! - Add /nextjs entrypoint - eliminating the need for @data-client/ssr package

  ```tsx
  import { DataProvider } from '@data-client/react/nextjs';

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <DataProvider>{children}</DataProvider>
        </body>
      </html>
    );
  }
  ```

- [`764728e`](https://github.com/reactive/data-client/commit/764728e45c26088a815e2f49b55d4f4ccab4d388) Thanks [@ntucker](https://github.com/ntucker)! - Support unreleased versions of React 19

- [#3095](https://github.com/reactive/data-client/pull/3095) [`aab27d9`](https://github.com/reactive/data-client/commit/aab27d956a9b47c2fd5f79869c1e68373c3e5745) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider -> DataProvider

  CacheProvider name is still usable

- Updated dependencies [[`764728e`](https://github.com/reactive/data-client/commit/764728e45c26088a815e2f49b55d4f4ccab4d388)]:
  - @data-client/use-enhanced-reducer@0.1.10

## 0.12.11

### Patch Changes

- [`ad23e04`](https://github.com/reactive/data-client/commit/ad23e04b717d9b3862ec9bd19dd51d6405904f18) Thanks [@ntucker](https://github.com/ntucker)! - React Native components have distinct name from non-native to help debuggability

## 0.12.9

### Patch Changes

- [#3074](https://github.com/reactive/data-client/pull/3074) [`1f1f66a`](https://github.com/reactive/data-client/commit/1f1f66a54219d65019f8c3cea380e627b317bbef) Thanks [@ntucker](https://github.com/ntucker)! - Compatibility with server/client component build rules

- Updated dependencies [[`1f1f66a`](https://github.com/reactive/data-client/commit/1f1f66a54219d65019f8c3cea380e627b317bbef)]:
  - @data-client/use-enhanced-reducer@0.1.9

## 0.12.8

### Patch Changes

- [#3071](https://github.com/reactive/data-client/pull/3071) [`7fba440`](https://github.com/reactive/data-client/commit/7fba44050a4e3fdcc37ab8405730b35366c293e1) Thanks [@ntucker](https://github.com/ntucker)! - React 19 JSX runtime compatibility.

  BREAKING CHANGE: Min React version 16.8.4 -> 16.14

  16.14 is the first version of React to include JSX runtime.

- Updated dependencies [[`7fba440`](https://github.com/reactive/data-client/commit/7fba44050a4e3fdcc37ab8405730b35366c293e1)]:
  - @data-client/use-enhanced-reducer@0.1.8

## 0.12.5

### Patch Changes

- [`e4d5f01`](https://github.com/reactive/data-client/commit/e4d5f019f7c3817fb740094244e8ce17ccd5452d) Thanks [@ntucker](https://github.com/ntucker)! - [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager) uses [maxAge](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage) to set buffer size

- [`30208fb`](https://github.com/reactive/data-client/commit/30208fb065cc071643f338c8e6333449e2cc0340) Thanks [@ntucker](https://github.com/ntucker)! - Only show devtools button when DevToolsManager is used

  Previously, one could use custom managers list and it
  would still show the devtools button. This was confusing
  as opening it would show no instance for Data Client.

- [`c3481ad`](https://github.com/reactive/data-client/commit/c3481ad578c77a6dc73f45f1afcec353ba032534) Thanks [@ntucker](https://github.com/ntucker)! - Fix DevToolsManager() config parameter correctly sets devtools config

- Updated dependencies [[`e4d5f01`](https://github.com/reactive/data-client/commit/e4d5f019f7c3817fb740094244e8ce17ccd5452d), [`c3481ad`](https://github.com/reactive/data-client/commit/c3481ad578c77a6dc73f45f1afcec353ba032534)]:
  - @data-client/core@0.12.5

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

- Updated dependencies [[`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d), [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259)]:
  - @data-client/use-enhanced-reducer@0.1.7
  - @data-client/core@0.12.3

## 0.12.1

### Patch Changes

- [#3043](https://github.com/reactive/data-client/pull/3043) [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c) Thanks [@ntucker](https://github.com/ntucker)! - Improve [controller](https://dataclient.io/docs/api/Controller) type matching for its methods

- [#3043](https://github.com/reactive/data-client/pull/3043) [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c) Thanks [@ntucker](https://github.com/ntucker)! - Improve [useFetch()](https://dataclient.io/docs/api/useFetch) argtype matching similar to [useSuspense()](https://dataclient.io/docs/api/useSuspense)

- [`6e9d36b`](https://github.com/reactive/data-client/commit/6e9d36b6cb287763c0fcc3f07d9f2ef0df619d12) Thanks [@ntucker](https://github.com/ntucker)! - Fix useDLE return loading and error when args can be null

- Updated dependencies [[`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c)]:
  - @data-client/core@0.12.1

## 0.11.5

### Patch Changes

- [#3033](https://github.com/reactive/data-client/pull/3033) [`2152b41`](https://github.com/reactive/data-client/commit/2152b41afc56027175bd36e7ef89c433a2e5e025) Thanks [@ntucker](https://github.com/ntucker)! - Environments without RequestIdleCallback will call immediately

- Updated dependencies [[`2152b41`](https://github.com/reactive/data-client/commit/2152b41afc56027175bd36e7ef89c433a2e5e025)]:
  - @data-client/core@0.11.5

## 0.11.4

### Patch Changes

- [#3020](https://github.com/reactive/data-client/pull/3020) [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d) Thanks [@ntucker](https://github.com/ntucker)! - Hooks arg-typechecking accuracy improved

  For example string literals now work:

  ```ts
  const getThing = new Endpoint(
    (args: { postId: string | number; sortBy?: 'votes' | 'recent' }) =>
      Promise.resolve({ a: 5, ...args }),
    { schema: MyEntity },
  );

  const myThing = useSuspense(getThing, {
    postId: '5',
    sortBy: 'votes',
  });
  ```

- [#3023](https://github.com/reactive/data-client/pull/3023) [`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5) Thanks [@renovate](https://github.com/apps/renovate)! - Compatibility with React 19 by removing defaultProps

- Updated dependencies [[`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5), [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d)]:
  - @data-client/use-enhanced-reducer@0.1.6
  - @data-client/core@0.11.4

## 0.11.2

### Patch Changes

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - ErrorBoundary listens to all errors

  This means it may catch errors that were previously passing thorugh

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - ErrorBoundary default error fallback supports react native

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - Add listen prop to ErrorBoundary and AsyncBoundary

  ```tsx
  <AsyncBoundary listen={history.listen}>
    <MatchedRoute index={0} />
  </AsyncBoundary>
  ```

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - Add resetErrorBoundary sent to errorComponent

  ```tsx
  function ErrorComponent({
    error,
    className,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
    className?: string;
  }) {
    return (
      <pre role="alert" className={className}>
        {error.message} <button onClick={resetErrorBoundary}>Reset</button>
      </pre>
    );
  }
  ```

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

- [#2963](https://github.com/reactive/data-client/pull/2963) [`7580500`](https://github.com/reactive/data-client/commit/7580500cecb2c4baa093f4db7b951af4840a0967) Thanks [@ntucker](https://github.com/ntucker)! - useCache() accepts Endpoints with sideEffects

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

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Add [useQuery()](https://dataclient.io/docs/api/useQuery) to render [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

  ```ts
  class User extends Entity {
    username = '';
    id = '';
    groupId = '';
    pk() {
      return this.id;
    }
    static index = ['username' as const];
  }

  const bob = useQuery(User, { username: 'bob' });
  ```

  ```ts
  const getUserCount = new schema.Query(
    new schema.All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter(user => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );

  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
  ```

  ```ts
  const UserCollection = new schema.Collection([User], {
    argsKey: (urlParams: { groupId?: string }) => ({
      ...urlParams,
    }),
  });

  const usersInGroup = useQuery(UserCollection, { groupId: '5' });
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

- [#2997](https://github.com/reactive/data-client/pull/2997) [`8d42ef6`](https://github.com/reactive/data-client/commit/8d42ef6fae10859bcac1812cdbe637c739afaa6d) Thanks [@ntucker](https://github.com/ntucker)! - useDLE() reactive native focus handling

  When using React Navigation, useDLE() will trigger fetches on focus if the data is considered
  stale.

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

- Updated dependencies [[`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161)]:
  - @data-client/core@0.11.0

## 0.10.0

### Minor Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object
  - `[]` and [schema.Array](https://dataclient.io/rest/api/Array) now behave in the same manner.
  - `null` values are now consistently handled everywhere (being retained).
    - These were already being retained in [nested Entities](https://dataclient.io/rest/guides/relational-data#nesting)
  - `undefined` is still filtered out.

### Patch Changes

- [`053e823`](https://github.com/reactive/data-client/commit/053e82377bd29f200cd7dfbc700da7a3ad7fa8d7) Thanks [@ntucker](https://github.com/ntucker)! - Update NextJS Demo link

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`4e6a39e`](https://github.com/reactive/data-client/commit/4e6a39ea2bfdb1390051f12781e899488609e1a8), [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474), [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae), [`056737e`](https://github.com/reactive/data-client/commit/056737ec98a2f4406b0239bcb86a5668cbd0ad92)]:
  - @data-client/core@0.10.0
  - @data-client/use-enhanced-reducer@0.1.5

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- Updated dependencies [[`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8)]:
  - @data-client/use-enhanced-reducer@0.1.4

## 0.9.7

### Patch Changes

- [`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62) Thanks [@ntucker](https://github.com/ntucker)! - docs: README uses svg version of logo

- Updated dependencies [[`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62)]:
  - @data-client/core@0.9.7

## 0.9.6

### Patch Changes

- [#2825](https://github.com/reactive/data-client/pull/2825) [`f5ac286623`](https://github.com/reactive/data-client/commit/f5ac286623a566acf5414a6ac8de18e9b7510ae7) Thanks [@ntucker](https://github.com/ntucker)! - CommonJS build includes NextJS App Directive compatibility

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/use-enhanced-reducer@0.1.3
  - @data-client/core@0.9.4

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

- [`9cafe908c1`](https://github.com/reactive/data-client/commit/9cafe908c1a0f5ed97f246acac37c1365bd4f476) Thanks [@ntucker](https://github.com/ntucker)! - docs: Update logo banner img

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95), [`327b94bedc`](https://github.com/reactive/data-client/commit/327b94bedc280e25c1766b3a51cc20078bfa1739)]:
  - @data-client/use-enhanced-reducer@0.1.2
  - @data-client/core@0.9.3

## 0.9.2

### Patch Changes

- [`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2) Thanks [@ntucker](https://github.com/ntucker)! - Better track state changes between each action

  Since React 18 batches updates, the real state can
  sometimes update from multiple actions, making it harder
  to debug. When devtools are open, instead of getting
  the real state - track a shadow state that accurately reflects
  changes from each action.

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2), [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/core@0.9.2
  - @data-client/use-enhanced-reducer@0.1.1

## 0.9.0

### Minor Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Replace BackupBoundary with UniversalSuspense + BackupLoading
  BREAKING: Remove BackupBoundary

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: In dev mode add second suspense boundary for devtool button. This will cause hydration mismatch if packages are not the same.

### Patch Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Add button to open devtools in development mode

  Can be disabled or location configured using `devButton` [CacheProvider](https://dataclient.io/docs/api/CacheProvider)
  property

  ```tsx
  <CacheProvider devButton={null}>
    <App />
  </CacheProvider>
  ```

  ```tsx
  <CacheProvider devButton="top-right">
    <App />
  </CacheProvider>
  ```

- [`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526) Thanks [@ntucker](https://github.com/ntucker)! - Endpoint properties fully visible in devtool

- [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b) Thanks [@ntucker](https://github.com/ntucker)! - DevTools no longer forgets history if not open on page load

- Updated dependencies [[`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526), [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b), [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7)]:
  - @data-client/core@0.9.0

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

- Updated dependencies [[`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee)]:
  - @data-client/core@0.8.1

## 0.8.0

### Minor Changes

- [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Remove all /next exports

- [#2787](https://github.com/reactive/data-client/pull/2787) [`8ec35d7143`](https://github.com/reactive/data-client/commit/8ec35d71437c4042c6cb824eceb490d31c36ae21) Thanks [@ntucker](https://github.com/ntucker)! - Remove makeCacheProvider

  Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderDataClient)

  ```tsx
  import { CacheProvider } from '@data-client/react';
  const renderDataClient = makeRenderDataClient(CacheProvider);
  ```

- [#2785](https://github.com/reactive/data-client/pull/2785) [`c6a2071178`](https://github.com/reactive/data-client/commit/c6a2071178c82c7622713c40c5a9fa5807c4e756) Thanks [@ntucker](https://github.com/ntucker)! - Add className to error boundary and errorClassName to [AsyncBoundary](https://dataclient.io/docs/api/AsyncBoundary)

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

- [#2791](https://github.com/reactive/data-client/pull/2791) [`a726d9178a`](https://github.com/reactive/data-client/commit/a726d9178a60fd81ff97d862ed4943e1fd4814c0) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider elements no longer share default managers

  New export: `getDefaultManagers()`

  BREAKING CHANGE: Newly mounted CacheProviders will have new manager
  objects when default is used

- [#2795](https://github.com/reactive/data-client/pull/2795) [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) _must_ support function calls

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

- [#2781](https://github.com/reactive/data-client/pull/2781) [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853) Thanks [@ntucker](https://github.com/ntucker)! - Prefix action types with 'rdc'

  BREAKING CHANGE: Action types have new names

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

- Updated dependencies [[`837cf57883`](https://github.com/reactive/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083), [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04), [`c865415ce5`](https://github.com/reactive/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a), [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c), [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853)]:
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
