# @data-client/vue

## 0.18.0

### Minor Changes

- [#3931](https://github.com/reactive/data-client/pull/3931) [`959465a`](https://github.com/reactive/data-client/commit/959465a064db687176e483932987b083f19718eb) - Allow one `Collection` schema to be used both top-level and nested.

  Before:

  ```ts
  const getTodos = new Collection([Todo], { argsKey });
  const userTodos = new Collection([Todo], { nestKey });
  ```

  After:

  ```ts
  const userTodos = new Collection([Todo], { argsKey, nestKey });
  ```

- [#3887](https://github.com/reactive/data-client/pull/3887) [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32) - **BREAKING**: `Schema.denormalize()` is now `(input, delegate)` instead
  of the previous `(input, args, unvisit)` 3-parameter signature.

  ```ts
  // before
  denormalize(input, args, unvisit) {
    return unvisit(this.schema, input);
  }

  // after
  denormalize(input, delegate) {
    return delegate.unvisit(this.schema, input);
  }
  ```

  The new [`IDenormalizeDelegate`](https://dataclient.io/rest/api/CustomSchema)
  exposes `unvisit`, `args`, and a new `argsKey(fn)` helper that registers
  a memoization dimension when output varies with endpoint args. Reading
  `delegate.args` directly does _not_ contribute to cache invalidation —
  schemas that branch on args must call `argsKey`. The `fn` reference
  doubles as the cache path key, so it must be **referentially stable**
  — define it on the instance or at module scope, not inline per call:

  ```ts
  class LensSchema {
    constructor({ lens }) {
      this.lensSelector = lens; // stable reference across calls
    }
    denormalize(input, delegate) {
      const portfolio = delegate.argsKey(this.lensSelector);
      return this.lookup(input, portfolio);
    }
  }
  ```

  All built-in schemas (`Array`, `Object`, `Values`, `Union`, `Query`,
  `Invalidate`, `Lazy`, `Collection`) have been updated. Custom schemas
  implementing `SchemaSimple` must update their `denormalize` signature.

  `Schema.normalize()` and the `visit()` callback also gain an optional
  trailing `parentEntity` argument tracking the nearest enclosing
  entity-like schema. This is additive — existing schemas don't need
  changes unless they want to use it.

- [#3887](https://github.com/reactive/data-client/pull/3887) [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32) - Add [Scalar](https://dataclient.io/rest/api/Scalar) schema for lens-dependent entity fields.

  `Scalar` models entity fields whose values vary by a runtime "lens" (such as the
  selected portfolio, currency, or locale). Multiple components can render the
  same entity through different lenses simultaneously — each sees the correct
  values without the entity itself ever being mutated. Lens-dependent values are
  stored in a separate cell table and joined at denormalize time from endpoint
  args.

  New exports: `Scalar`, `schema.Scalar`.

  A single `Scalar` instance can serve both as an `Entity.schema` field (parent
  entity inferred from the visit) and standalone — inside `Values(Scalar)`,
  `[Scalar]`, or `Collection([Scalar])` — for cheap column-only refreshes
  (entity bound explicitly via `entity`). Cell pks are derived from the map key
  or via `Scalar.entityPk()`, which defaults to `Entity.pk()` so custom and
  composite primary keys work with no override:

  ```ts
  import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

  class Company extends Entity {
    id = '';
    price = 0;
    pct_equity = 0;
    shares = 0;
  }
  const PortfolioScalar = new Scalar({
    lens: args => args[0]?.portfolio,
    key: 'portfolio',
    entity: Company,
  });
  Company.schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };

  // Full load — Company rows + scalar cells for the current portfolio
  export const getCompanies = new RestEndpoint({
    path: '/companies',
    searchParams: {} as { portfolio: string },
    schema: new Collection([Company], { argsKey: () => ({}) }),
  });
  // Lens-only refresh — writes to the same Scalar(portfolio) cell table
  export const getPortfolioColumns = new RestEndpoint({
    path: '/companies/columns',
    searchParams: {} as { portfolio: string },
    schema: new Collection([PortfolioScalar], {
      argsKey: ({ portfolio }) => ({ portfolio }),
    }),
  });
  ```

  `useSuspense(getCompanies, { portfolio: 'A' })` and
  `useSuspense(getCompanies, { portfolio: 'B' })` resolve to different
  `pct_equity` / `shares` while sharing the same `Company` row.

  `Scalar.queryKey` enumerates cells in its table for the current lens, so
  endpoints that use `Scalar` directly as their top-level schema reconstruct
  from cache without a network round-trip once the cells are present.

### Patch Changes

- Updated dependencies [[`959465a`](https://github.com/reactive/data-client/commit/959465a064db687176e483932987b083f19718eb), [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32), [`6e8e499`](https://github.com/reactive/data-client/commit/6e8e499441741b58ad35127b517e8d83fc7a58fd), [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32)]:
  - @data-client/core@0.18.0

## 0.16.1

### Patch Changes

- [`fd64b41`](https://github.com/reactive/data-client/commit/fd64b41a9de266af51708622ea8991060fd788a5) - Include `@data-client/normalizr@0.16.6` performance improvements:
  - [#3875](https://github.com/reactive/data-client/pull/3875) [`467a5f6`](https://github.com/reactive/data-client/commit/467a5f6f9d4cdaf0927fa7e22520c5d2c1462ff5) - Fix deepClone to only copy own properties

    `deepClone` in the immutable store path now uses `Object.keys()` instead of `for...in`, preventing inherited properties from being copied into cloned state.

  - [#3877](https://github.com/reactive/data-client/pull/3877) [`e9e96f1`](https://github.com/reactive/data-client/commit/e9e96f1751895c17e046461a1c38bb4bb093c141) - Replace megamorphic computed dispatch in getDependency with switch

    `getDependency` used `delegate[array[index]](...spread)` which creates a temporary array, a computed property lookup, and a spread call on every invocation — a megamorphic pattern that prevents V8 from inlining or type-specializing the call site. Replaced with a `switch` on `path.length` for monomorphic dispatch.

  - [#3876](https://github.com/reactive/data-client/pull/3876) [`7d28629`](https://github.com/reactive/data-client/commit/7d28629d07f6cade43e36f3cf1956f175f98d84f) - Improve denormalization performance by pre-allocating the dependency tracking slot

    Replace `Array.prototype.unshift()` in `GlobalCache.getResults()` with a pre-allocated slot at index 0, avoiding O(n) element shifting on every cache-miss denormalization.

  - [#3884](https://github.com/reactive/data-client/pull/3884) [`7df6a49`](https://github.com/reactive/data-client/commit/7df6a49ee9fcdac10f9f24ec48c4df0931efa0b0) - Move entity table POJO clone from getNewEntities to setEntity

    Lazy-clone entity and meta tables on first write per entity type instead of eagerly in getNewEntities. This keeps getNewEntities as a pure Map operation, eliminating its V8 Maglev bailout ("Insufficient type feedback for generic named access" on `this.entities`).

  - [#3878](https://github.com/reactive/data-client/pull/3878) [`98a7831`](https://github.com/reactive/data-client/commit/98a78318770feaa8433708693bec90b81cbcb1b2) - Avoid hidden class mutation in normalize() return object

    The normalize result object was constructed with `result: '' as any` then mutated via `ret.result = visit(...)`, causing a V8 hidden class transition when the property type changed from string to the actual result type. Restructured to compute the result first and construct the final object in a single step.

- Updated dependencies [[`fd64b41`](https://github.com/reactive/data-client/commit/fd64b41a9de266af51708622ea8991060fd788a5)]:
  - @data-client/core@0.16.7

## 0.16.0

### Minor Changes

- [#3752](https://github.com/reactive/data-client/pull/3752) [`3c3bfe8`](https://github.com/reactive/data-client/commit/3c3bfe81ff0c3a786d6804a61f9e7a4362947dcb) - BREAKING CHANGE: [useFetch()](/docs/api/useFetch) always returns a stable promise with a `.resolved` property, even when data is already cached.

  #### before

  ```tsx
  const promise = useFetch(MyResource.get, { id });
  if (promise) {
    // fetch was triggered
  }
  ```

  #### after

  ```tsx
  const promise = useFetch(MyResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  use(promise); // works with React.use()
  ```

### Patch Changes

- [#3753](https://github.com/reactive/data-client/pull/3753) [`e54c9b6`](https://github.com/reactive/data-client/commit/e54c9b6e6a48939263f41496a90387ee614d35f5) - Add `globalThis.__DC_CONTROLLERS__` Map in dev mode for programmatic store access from browser DevTools MCP, React Native debuggers, and other development tooling.

  Each [DataProvider](/docs/api/DataProvider) registers its [Controller](/docs/api/Controller) keyed by the devtools connection name, supporting multiple providers on the same page.

- [#3823](https://github.com/reactive/data-client/pull/3823) [`869f28f`](https://github.com/reactive/data-client/commit/869f28fc651ca5e8b0f935089fc0b8d8ce8585cb) - Fix stack overflow during denormalization of large bidirectional entity graphs.

  Add entity depth limit (64) to prevent `RangeError: Maximum call stack size exceeded`
  when denormalizing cross-type chains with thousands of unique entities
  (e.g., Department → Building → Department → ...). Entities beyond the depth limit
  are returned with unresolved ids instead of fully denormalized nested objects.

  The limit can be configured per-Entity with [`static maxEntityDepth`](/rest/api/Entity#maxEntityDepth):

  ```ts
  class Department extends Entity {
    static maxEntityDepth = 16;
  }
  ```

- Updated dependencies [[`e54c9b6`](https://github.com/reactive/data-client/commit/e54c9b6e6a48939263f41496a90387ee614d35f5), [`869f28f`](https://github.com/reactive/data-client/commit/869f28fc651ca5e8b0f935089fc0b8d8ce8585cb), [`0e0ff1a`](https://github.com/reactive/data-client/commit/0e0ff1ab49b1a58477b07dba3dfc73df6d4af3f5)]:
  - @data-client/core@0.16.0

## 0.15.4

### Patch Changes

- [#3738](https://github.com/reactive/data-client/pull/3738) [`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1) - Optimistic updates support FormData

- Updated dependencies [[`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1)]:
  - @data-client/core@0.15.7

## 0.15.3

### Patch Changes

- [`ad501b6`](https://github.com/reactive/data-client/commit/ad501b62ec231ff771da05d32053934960c8800c) - Add skill reference to readme

## 0.15.2

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

## 0.15.1

### Patch Changes

- [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133) Thanks [@ntucker](https://github.com/ntucker)! - Fix image links in package README

- Updated dependencies [[`bf3ac79`](https://github.com/reactive/data-client/commit/bf3ac7966dc615b1dc6cc6c6d600148fdca4e354), [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133)]:
  - @data-client/core@0.15.3

## 0.15.0

### Minor Changes

- [`733091f`](https://github.com/reactive/data-client/commit/733091f09b503ef7bb7d435a1d86dd7cbcfd96bb) Thanks [@ntucker](https://github.com/ntucker)! - Never wrap renderDataCompose().result in ref. Just passthrough the return value directly. Always.

  ### Before

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useSuspense(CoolerArticleResource.get, { id: payload.id }),
  );

  const articleRef = await result.value;
  expect(articleRef.value.title).toBe(payload.title);
  expect(articleRef.value.content).toBe(payload.content);
  ```

  ### After

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useSuspense(CoolerArticleResource.get, { id: payload.id }),
  );

  const articleRef = await result;
  expect(articleRef.value.title).toBe(payload.title);
  expect(articleRef.value.content).toBe(payload.content);
  ```

- [`354b44c`](https://github.com/reactive/data-client/commit/354b44ca60a95cca64619d19c3314090d8edb29e) Thanks [@ntucker](https://github.com/ntucker)! - @data-client/vue first release

- [#3591](https://github.com/reactive/data-client/pull/3591) [`aecd59b`](https://github.com/reactive/data-client/commit/aecd59becae7fb722eee4bd5035f2a654e75d5d8) Thanks [@ntucker](https://github.com/ntucker)! - `renderDataCompose()` awaits until the composable runs

  ### Before

  ```ts
  const { result, cleanup } = renderDataCompose(() =>
    useCache(CoolerArticleResource.get, { id: payload.id }),
  );

  // Wait for initial render
  await waitForNextUpdate();

  expect(result.current).toBeDefined();
  ```

  ### After

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useCache(CoolerArticleResource.get, { id: payload.id }),
  );

  expect(result.value).toBeDefined();
  ```

- [#3591](https://github.com/reactive/data-client/pull/3591) [`aecd59b`](https://github.com/reactive/data-client/commit/aecd59becae7fb722eee4bd5035f2a654e75d5d8) Thanks [@ntucker](https://github.com/ntucker)! - `renderDataCompose().result` is now simply passes the composable result if it's a ref, or wraps it as computable ref

- [#3592](https://github.com/reactive/data-client/pull/3592) [`4c9465b`](https://github.com/reactive/data-client/commit/4c9465bdcb139d79ca7205925e93fc45d37f3281) Thanks [@ntucker](https://github.com/ntucker)! - Add useDLE()

  ```ts
  const { date, loading, error } = useDLE(
    CoolerArticleResource.get,
    computed(() => (props.id !== null ? { id: props.id } : null)),
  );
  ```

### Patch Changes

- [`d52fa38`](https://github.com/reactive/data-client/commit/d52fa38115950db8d3f3fde2d364c9f0ad8aaf65) Thanks [@ntucker](https://github.com/ntucker)! - Fixed race condition in useSuspense() where args change while initial suspense is not complete

- [#3584](https://github.com/reactive/data-client/pull/3584) [`6809480`](https://github.com/reactive/data-client/commit/68094805498056ff3353507478908b87bb03209a) Thanks [@ntucker](https://github.com/ntucker)! - Only run manager start/stop for app lifecycle - not every component mount

- [#3622](https://github.com/reactive/data-client/pull/3622) [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042) Thanks [@ntucker](https://github.com/ntucker)! - Add MockPlugin

  Example usage:

  ```ts
  import { createApp } from 'vue';
  import { DataClientPlugin } from '@data-client/vue';
  import { MockPlugin } from '@data-client/vue/test';

  const app = createApp(App);
  app.use(DataClientPlugin);
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        args: [{ id: 1 }],
        response: { id: 1, name: 'Test' },
      },
    ],
  });
  app.mount('#app');
  ```

  Interceptors allow dynamic responses based on request arguments:

  ```ts
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        response: (...args) => {
          const [{ id }] = args;
          return {
            id,
            name: `Dynamic ${id}`,
          };
        },
      },
    ],
  });
  ```

  Interceptors can also maintain state across calls:

  ```ts
  const interceptorData = { count: 0 };

  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        response: function (this: { count: number }, ...args) {
          this.count++;
          const [{ id }] = args;
          return {
            id,
            name: `Call ${this.count}`,
          };
        },
      },
    ],
    getInitialInterceptorData: () => interceptorData,
  });
  ```

- [`eae4fe4`](https://github.com/reactive/data-client/commit/eae4fe4004ff506a020fac0ca7b322d7eda0aac2) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> renderDataCompose

  This keeps naming conventions closer to the React version

- [#3684](https://github.com/reactive/data-client/pull/3684) [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f) Thanks [@ntucker](https://github.com/ntucker)! - Optimize normalization performance with faster loops and Set-based cycle detection

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> mountDataClient
  renderDataComposable -> renderDataClient

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Make composables reactive to computed props

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Add useCache()

- [`1c945bb`](https://github.com/reactive/data-client/commit/1c945bbc4cd290a186914f16b9afd9e7501198ed) Thanks [@ntucker](https://github.com/ntucker)! - Update README with MockPlugin

- [`b03fa99`](https://github.com/reactive/data-client/commit/b03fa99f1327e91ffad840b90d4ac5ef05a358d3) Thanks [@ntucker](https://github.com/ntucker)! - Improve dependency injection console message

- Updated dependencies [[`a4092a1`](https://github.com/reactive/data-client/commit/a4092a14999bfe3aa5cf613bb009264ec723ff99), [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`d44d36a`](https://github.com/reactive/data-client/commit/d44d36a7de0a18817486c4f723bf2f0e86ac9677), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7)]:
  - @data-client/core@0.15.0
