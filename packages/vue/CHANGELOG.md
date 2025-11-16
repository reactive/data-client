# @data-client/vue

## 0.3.2-beta-20251116224907-3174fe59b114d2037762a6458f5576d23e483ba4

### Patch Changes

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

- Updated dependencies [[`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042)]:
  - @data-client/core@0.15.1-beta-20251116224907-3174fe59b114d2037762a6458f5576d23e483ba4

## 0.2.0-beta-20251026233651-4c1d5c9084df801287cc120cd7a9c77b9bbe96e0

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

- [`eae4fe4`](https://github.com/reactive/data-client/commit/eae4fe4004ff506a020fac0ca7b322d7eda0aac2) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> renderDataCompose

  This keeps naming conventions closer to the React version

## 0.2.0-beta-20251026024409-a1c466cfd7aac770879b584acaac40fa61d01b61

### Patch Changes

- [#3584](https://github.com/reactive/data-client/pull/3584) [`6809480`](https://github.com/reactive/data-client/commit/68094805498056ff3353507478908b87bb03209a) Thanks [@ntucker](https://github.com/ntucker)! - Only run manager start/stop for app lifecycle - not every component mount

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> mountDataClient
  renderDataComposable -> renderDataClient

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Make composables reactive to computed props

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Add useCache()

## 0.2.0-beta-20251022142546-a457d1596871fb28f1a91f2531cc259db4d55a9c

### Patch Changes

- [`a457d15`](https://github.com/reactive/data-client/commit/a457d1596871fb28f1a91f2531cc259db4d55a9c) Thanks [@ntucker](https://github.com/ntucker)! - Republish to fix dependency refernces

- Updated dependencies [[`a457d15`](https://github.com/reactive/data-client/commit/a457d1596871fb28f1a91f2531cc259db4d55a9c)]:
  - @data-client/core@0.15.0-beta-20251022142546-a457d1596871fb28f1a91f2531cc259db4d55a9c

## 0.2.0-beta-20251022010821-0e5f6bd2963b6deecb68b5febe71cdd3b10c801a

### Minor Changes

- [`354b44c`](https://github.com/reactive/data-client/commit/354b44ca60a95cca64619d19c3314090d8edb29e) Thanks [@ntucker](https://github.com/ntucker)! - @data-client/vue first release

### Patch Changes

- Updated dependencies []:
  - @data-client/core@0.15.0-beta-20251006024044-92bd01c4976f2921993b8c9f1e4dbb87af87ba7b
