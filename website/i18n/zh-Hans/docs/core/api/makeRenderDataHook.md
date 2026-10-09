---
frameworks: [react]
framework_equivalent: guides/unit-testing-composables
title: makeRenderDataHook()
---

```typescript
function makeRenderDataHook(
  Provider: React.ComponentType<ProviderProps>,
): RenderDataClientFunction;
```

`makeRenderDataHook()` 用于测试依赖 `Reactive Data Client` 的 hook。它会创建一个 renderDataClient()
函数，其用法与 [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library) 的 [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) 一致，但会额外包裹一个 `<Suspense/>` 边界，
并处于 `<Provider />` context 之中。

## 参数 {#arguments}

### Provider {#provider}

```typescript
interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: new (props: { gcPolicy: GCInterface }) => Controller;
}
```

Reactive Data Client 的 [&lt;DataProvider /&gt;](./DataProvider.md)

- `import { DataProvider } from @data-client/react;`
- `import { DataProvider } from @data-client/react/redux;`

## 示例 {#example}

```typescript
import { DataProvider } from '@data-client/react/redux';
import { useSuspense } from '@data-client/react';
import { makeRenderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

let renderDataHook: ReturnType<typeof makeRenderDataHook>;

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
  const { result, waitFor, controller } = renderDataHook(
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
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: response.id },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```
