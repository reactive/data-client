# @data-client/vue

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
