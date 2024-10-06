---
title: makeRenderDataHook()
---

```typescript
function makeRenderDataHook(
  Provider: React.ComponentType<ProviderProps>,
): RenderDataClientFunction;
```

`makeRenderDataHook()` is useful to test hooks that rely on the `Reactive Data Client`. It creates a renderDataClient()
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

The Reactive Data Client [&lt;DataProvider /&gt;](./DataProvider.md)

- `import { DataProvider } from @data-client/react;`
- `import { DataProvider } from @data-client/react/redux;`

## Example


```typescript
import { DataProvider } from '@data-client/react/redux';
import { makeRenderDataHook } from '@data-client/test';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

beforeEach(() => {
  renderDataHook = makeRenderDataHook(DataProvider);
});

it('should resolve useSuspense()', async () => {
  const { result, waitFor } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, response);
    },
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          response: ({ id }) => ({ ...response, id }),
        },
        {
          endpoint: ArticleResource.partialUpdate,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  // this indicates suspense
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current instanceof ArticleResource).toBe(true);
  expect(result.current.title).toBe(response.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: response.id },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```
