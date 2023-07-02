---
title: makeRenderRestHook()
---

```typescript
function makeRenderRestHook(
  Provider: React.ComponentType<ProviderProps>,
): RenderRestHookFunction;
```

`makeRenderRestHook()` is useful to test hooks that rely on the `Reactive Data Client`. It creates a renderRestHook()
function that mirrors [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library)'s [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) but does so with a `<Suspense/>` boundary
as well as in a `<Provider />` context.

## Arguments

### Provider

```typescript
interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}
```

The Reactive Data Client [&lt;CacheProvider /&gt;](./CacheProvider.md)

- `import { CacheProvider } from @data-client/react;`
- `import { CacheProvider } from @data-client/redux;`

## renderRestHook()

Returned from makeRenderRestHook():

```typescript
type RenderRestHookFunction = {
  <P, R, T=any>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      wrapper?: React.ComponentType;
    },
  ): {
    rerender: (props?: Props) => void;
    result: {
      current: Result;
      error?: Error;
    };
    unmount: () => void;
    /* @deprecated */
    waitForNextUpdate: (options?: waitForOptions) => Promise<void>;
    waitFor<T>(
      callback: () => Promise<T> | T,
      options?: waitForOptions,
    ): Promise<T>;
  };
  controller: Controller;
  cleanup(): void;
  allSettled(): Promise<unknown>;
};
```

`renderRestHook()` creates a Provider context with new manager instances. This means each call
to `renderRestHook()` will result in a completely fresh cache state as well as manager state.

### Arguments

#### callback

Hooks to run inside React. Return value will become available in `result`

#### options.initialFixtures

Can be used to prime the cache if test expects cache values to already be filled. Takes an
[array of fixtures](./Fixtures.md)

This has the same effect as initializing [&lt;CacheProvider /\>](../api/CacheProvider) with [mockInitialState()](../api/mockInitialState)

#### options.resolverFixtures

These [fixtures or interceptors](./Fixtures.md) are used to resolve any new requests. This is most useful for mocking imperative fetches like mutations, but can also allow testing suspending states or transitions.

Works by adding [MockResolver](../api/MockResolver.md) as a wrapper.

#### options.getInitialInterceptorData

Function that initializes the `this` attribute for all interceptors.

#### options.initialProps

The initial values to pass to the callback function

#### options.wrapper

Pass a React Component as the wrapper option to have it rendered around the inner element

### controller

[Controller](./Controller.md) to dispatch imperative effects

### cleanup()

Cleans up all managers used in tests. Should be run in `afterEach()` to ensure each test starts fresh.
This is especially important when mocking timers, as Reactive Data Client' internals relies on real timers to
avoid race conditions.

### allSettled()

Returns a promise that resolves once all inflight requests are completed.

### Returns

- `result` (`object`)
  - `current` (`any`) - the return value of the `callback` function
  - `error` (`Error`) - the error that was thrown if the `callback` function threw an error during rendering
- `waitForNextUpdate` (`function`) - returns a `Promise` that resolves the next time the hook renders, commonly when state is updated as the result of a asynchronous action.
- `rerender` (`function([newProps])`) - function to rerender the test component including any hooks called in the `callback` function. If `newProps` are passed, the will replace the `initialProps` passed the the `callback` function for future renders.
- `unmount` (`function()`) - function to unmount the test component, commonly used to trigger cleanup effects for `useEffect` hooks.

[@testing-library/react-hooks reference](https://react-hooks-testing-library.com/reference/api#renderhook-result)

## Example

```typescript
import { makeRenderRestHook, makeCacheProvider } from '@data-client/test';

const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

beforeEach(() => {
  renderRestHook = makeRenderRestHook(CacheProvider);
});

it('should resolve useSuspense()', async () => {
  const { result, waitFor } = renderRestHook(
    () => {
      return useSuspense(ArticleResource.get, payload);
    },
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          response: ({ id }) => ({ ...payload, id }),
        },
        {
          endpoint: ArticleResource.partialUpdate,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current instanceof ArticleResource).toBe(true);
  expect(result.current.title).toBe(payload.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: 'abc123' },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```
