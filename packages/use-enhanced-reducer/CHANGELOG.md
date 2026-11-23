# @data-client/use-enhanced-reducer

## 0.2.0

### Minor Changes

- [#4593](https://github.com/reactive/data-client/pull/4593) [`6855822`](https://github.com/reactive/data-client/commit/6855822af2adcb024495a2394bcb7ce7bf7918ac) - BREAKING: [Manager.cleanup()](https://dataclient.io/docs/api/Manager#cleanup) no longer means the store is gone

  `cleanup()` now pauses a Manager. It does not end the store. `DataProvider` runs `init()` and `cleanup()` like an Effect's [setup and cleanup](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development). So React StrictMode, and [`<Activity>`](https://react.dev/reference/react/Activity) hiding a `DataProvider`, call `cleanup()` and later `init()` on the same store. The store keeps applying actions in between. In a custom Manager:

  - Start timers and connections in `init()`, and stop them in `cleanup()`.
  - Don't reset state about the store, like fetches in flight, in `cleanup()`.
  - Expect actions after `cleanup()`. Guard side effects with a field `cleanup()` clears, like `this.channel?.postMessage()`.

  A Manager that started an interval in `middleware` never restarted it after a hide and show:

  ```ts title="Before"
  middleware: Middleware = controller => {
    this.intervalID = setInterval(() => {
      controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);
    return next => async action => next(action);
  };

  cleanup() {
    clearInterval(this.intervalID);
  }
  ```

  ```ts title="After"
  middleware: Middleware = controller => {
    this.controller = controller;
    return next => async action => next(action);
  };

  init() {
    this.intervalID = setInterval(() => {
      this.controller.set(CurrentTime, { id: 1 }, { id: 1, time: Date.now() });
    }, 1000);
  }

  cleanup() {
    clearInterval(this.intervalID);
  }
  ```

  [NetworkManager](https://dataclient.io/docs/api/NetworkManager) resolves responses that arrive after `cleanup()`. `NetworkManager.cleanupDate` is removed, since nothing reads it now. Delete code that reads or sets it.

  On React 18 and later, an unmounted `DataProvider` now passes actions to its Managers, so its `fetch()` is sent. When a new `DataProvider` uses the same Managers, a `fetch()` from the unmounted one is not sent. Either way, React ignores the store update, so promises that wait for it never resolve: `set()`, `setResponse()`, `resetEntireStore()`, and `fetch()` of an endpoint without `sideEffect`. Don't `await` them after unmount. React 16 and 17 still drop these actions.

  Why: `cleanup()` used to stop dispatches because React 16/17 warn about state updates after unmount. React 18 removed that warning, and an Effect cleanup can't tell hiding from unmounting.

### Patch Changes

- [#4593](https://github.com/reactive/data-client/pull/4593) [`6855822`](https://github.com/reactive/data-client/commit/6855822af2adcb024495a2394bcb7ce7bf7918ac) - Support React [`<Activity>`](https://react.dev/reference/react/Activity) above [DataProvider](https://dataclient.io/docs/api/DataProvider)

  ```tsx
  <Activity mode={tab === 'posts' ? 'visible' : 'hidden'}>
    <DataProvider>
      <Posts />
    </DataProvider>
  </Activity>
  ```

  Most apps should still put `DataProvider` at the root, above everything, including `<Activity>`. That still works as before.

  Before, hiding a `DataProvider` dropped responses, so [useSuspense()](https://dataclient.io/docs/api/useSuspense) could stay suspended forever, optimistic updates never settled, `controller.fetch()` never resolved, and [useSubscription()](https://dataclient.io/docs/api/useSubscription) stopped polling for good. Now a hidden `DataProvider` keeps working, and promises resolve once it is shown.

  A `DataProvider` remounted with the same `managers` also no longer waits on a fetch the unmounted one started, and responses for the unmounted one stay out of the new store.

  A response to a fetch started before [`resetEntireStore()`](https://dataclient.io/docs/api/Controller#resetEntireStore) is now always dropped, even when it lands before the reset commits. A response also no longer settles an in-flight fetch of the same key that has a later `fetchedAt`; that fetch waits for its own response. Custom managers that call [`controller.resolve()`](https://dataclient.io/docs/api/Controller#resolve) should pass the `fetchedAt` of the fetch action they are resolving (`action.meta.fetchedAt`).

- [#4209](https://github.com/reactive/data-client/pull/4209) [`b4899d0`](https://github.com/reactive/data-client/commit/b4899d05731ad672cf17432ba603008a8c888169) Thanks [@renovate](https://github.com/apps/renovate)! - Support `@babel/runtime` 8

  Apps on Babel 8 now share their `@babel/runtime` with Data Client instead of installing a second copy. Apps on Babel 7 keep working unchanged.

- [#4613](https://github.com/reactive/data-client/pull/4613) [`c17ca4f`](https://github.com/reactive/data-client/commit/c17ca4f93da2f7f9441c052568edfca1d3e80498) - Fix `DataProvider` crashing in Vitest 2 tests

  With Vitest 2 and the `jsdom` environment, rendering `DataProvider` threw
  `TypeError: useEnhancedReducer is not a function or its return value is not iterable`
  unless the app inlined Data Client with `server.deps.inline`. It now renders with Vitest's default config, so you can
  remove that workaround:

  ```ts title="vite.config.ts"
  export default defineConfig({
    test: {
      environment: 'jsdom',
      // no longer needed
      // server: { deps: { inline: [/@data-client/] } },
    },
  });
  ```

## 0.1.14

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

## 0.1.13

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

## 0.1.12

### Patch Changes

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

## 0.1.11

### Patch Changes

- [`4095003`](https://github.com/reactive/data-client/commit/4095003f40f4f6436a790d108ee13bcae1a2cdfa) Thanks [@ntucker](https://github.com/ntucker)! - Improve compatibility with React 19

## 0.1.10

### Patch Changes

- [`764728e`](https://github.com/reactive/data-client/commit/764728e45c26088a815e2f49b55d4f4ccab4d388) Thanks [@ntucker](https://github.com/ntucker)! - Support unreleased versions of React 19

## 0.1.9

### Patch Changes

- [#3074](https://github.com/reactive/data-client/pull/3074) [`1f1f66a`](https://github.com/reactive/data-client/commit/1f1f66a54219d65019f8c3cea380e627b317bbef) Thanks [@ntucker](https://github.com/ntucker)! - Compatibility with server/client component build rules

## 0.1.8

### Patch Changes

- [#3071](https://github.com/reactive/data-client/pull/3071) [`7fba440`](https://github.com/reactive/data-client/commit/7fba44050a4e3fdcc37ab8405730b35366c293e1) Thanks [@ntucker](https://github.com/ntucker)! - React 19 JSX runtime compatibility.

  BREAKING CHANGE: Min React version 16.8.4 -> 16.14

  16.14 is the first version of React to include JSX runtime.

## 0.1.7

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

## 0.1.6

### Patch Changes

- [#3023](https://github.com/reactive/data-client/pull/3023) [`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5) Thanks [@renovate](https://github.com/apps/renovate)! - Compatibility with React 19 by removing defaultProps

## 0.1.5

### Patch Changes

- [`056737e`](https://github.com/reactive/data-client/commit/056737ec98a2f4406b0239bcb86a5668cbd0ad92) Thanks [@ntucker](https://github.com/ntucker)! - Add Manager examples to readme

## 0.1.4

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

## 0.1.3

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

## 0.1.2

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

## 0.1.1

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization
