---
title: makeRenderRestHook()
---

```typescript
function makeRenderRestHook(makeProvider: ProviderType): RenderRestHookFunction;
```

`makeRenderRestHook()` is useful to test hooks that rely on the `rest-hooks`. It creates a renderRestHook()
function that mirrors [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library)'s [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) but does so with a `<Suspense/>` boundary
as well as in a `<Provider />` context.

## Arguments

### makeProvider

```typescript
type ProviderType = (
  managers: Manager[],
  initialState?: State<unknown>,
) => React.ComponentType<{
  children: React.ReactChild;
}>;
```

Function to generate the provider used in `renderRestHook()`. The purpose of this is to unify construction of
providers as they both are initialized in a very different fashion.

- [makeCacheProvider()](./makeCacheProvider.md)
- [makeExternalCacheProvider()](./makeExternalCacheProvider.md)

## renderRestHook()

Returned from makeRenderRestHook():

```typescript
type RenderRestHookFunction = {
  <P, R>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      results?: Fixture[];
      wrapper?: React.ComponentType;
    },
  ): {
    readonly result: {
      readonly current: R;
      readonly error: Error;
    };
    readonly waitForNextUpdate: () => Promise<void>;
    readonly unmount: () => boolean;
    readonly rerender: (hookProps?: P | undefined) => void;
  };
  cleanup(): void;
};
```

`renderRestHook()` creates a Provider context with new manager instances. This means each call
to `renderRestHook()` will result in a completely fresh cache state as well as manager state.

### Arguments

#### callback

Hooks to run inside React. Return value will become available in `result`

#### options.results

Can be used to prime the cache if test expects cache values to already be filled. Takes same
[array of fixtures as MockProvider](https://resthooks.io/docs/api/MockProvider#results)

#### options.initialProps

The initial values to pass to the callback function

#### options.wrapper

Pass a React Component as the wrapper option to have it rendered around the inner element

### cleanup()

Cleans up all managers used in tests. Should be run in `afterEach()` to ensure each test starts fresh.

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
import { makeRenderRestHook, makeCacheProvider } from '@rest-hooks/test';

const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

beforeEach(() => {
  nock('http://test.com')
    .get(`/article-cooler/${payload.id}`)
    .reply(200, payload);
  renderRestHook = makeRenderRestHook(makeCacheProvider);
});

afterEach(() => {
  renderRestHook.cleanup();
});

it('should resolve useResource()', async () => {
  const { result, waitForNextUpdate } = renderRestHook(() => {
    return useResource(ArticleResource.detail(), payload);
  });
  expect(result.current).toBeUndefined();
  await waitForNextUpdate();
  expect(result.current instanceof ArticleResource).toBe(true);
  expect(result.current.title).toBe(payload.title);
});
```
