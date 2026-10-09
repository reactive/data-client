---
frameworks: [react]
title: 组件的单元测试
---

:::warning

在 Reactive Data Client 这类模块上使用 [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) 时要小心。去掉预期的
导出可能会导致难以追踪的
错误，例如 `TypeError: Class extends value undefined is not a function or null`。

更好的做法是使用[部分 mock](https://jestjs.io/docs/mock-functions#mocking-partials)，
或者更推荐在你的 endpoint 上使用
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules)。

:::

如果你需要为组件添加单元测试来检查某些行为，你可能希望
避开网络请求的获取周期，因为它很可能与你想要测试的内容
无关。在测试中将 [&lt;DataProvider /\>](../api/DataProvider.md) 与 [mockInitialState](../api/mockInitialState.md) 和 [Fixtures](../api/Fixtures.md) 一起使用，
可以用提供的 fixture 预先填充缓存，这样组件就会立即使用这些结果
进行渲染。

借助 [&lt;MockResolver /\>](../api/MockResolver.md)
和 [Interceptors](../api/Fixtures.md#interceptor)，可以更方便地测试会触发变更的用户交互。

```typescript title="__tests__/fixtures.ts"
import { ArticleResource } from '../resources/Article';

export default {
  full: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: [
        {
          id: 5,
          content: 'have a merry christmas',
          author: 2,
          contributors: [],
        },
        {
          id: 532,
          content: 'never again',
          author: 23,
          contributors: [5],
        },
      ],
    },
    {
      endpoint: ArticleResource.update,
      args: [{ id: 532 }] as const,
      response({ id }, body) {
        return {
          id,
          ...body,
        };
      },
    },
  ],
  empty: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: [],
    },
  ],
  error: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
  loading: [],
};
```

```tsx title="__tests__/ArticleList.tsx"
import { DataProvider, AsyncBoundary } from '@data-client/react';
import { render, waitFor } from '@testing-library/react';
import { MockResolver, mockInitialState } from '@data-client/test';

import ArticleList from 'components/ArticleList';
import results from './fixtures';

describe('<ArticleList />', () => {
  it('renders', () => {
    const tree = (
      <DataProvider initialState={mockInitialState(results.full)}>
        <ArticleList maxResults={10} />
      </DataProvider>
    );
    const { findByText } = render(tree);
    const content = findByText(results.full[0].response[0].content);
    expect(content).toBeDefined();
  });

  it('suspends then resolves', async () => {
    const tree = (
      <DataProvider>
        <MockResolver fixtures={results.full}>
          <AsyncBoundary fallback="loading">
            <ArticleList maxResults={10} />
          </AsyncBoundary>
        </MockResolver>
      </DataProvider>
    );
    const { findByText } = render(tree);
    expect(findByText('loading')).toBeDefined();

    await waitFor(() =>
      expect(findByText(results.full[0].response[0].content)).toBeDefined(),
    );
  })
});
```
