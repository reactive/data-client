# @data-client/vue

## 0.4.0

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

- [`eae4fe4`](https://github.com/reactive/data-client/commit/eae4fe4004ff506a020fac0ca7b322d7eda0aac2) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> renderDataCompose

  This keeps naming conventions closer to the React version

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> mountDataClient
  renderDataComposable -> renderDataClient

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Make composables reactive to computed props

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Add useCache()

- Updated dependencies [[`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`d44d36a`](https://github.com/reactive/data-client/commit/d44d36a7de0a18817486c4f723bf2f0e86ac9677), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7)]:
  - @data-client/core@0.15.0
