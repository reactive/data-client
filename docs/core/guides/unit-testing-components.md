---
title: Unit testing components
---

:::warning

Be careful when using [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) on modules like Reactive Data Client. Eliminating expected
exports can lead to hard-to trace
errors like `TypeError: Class extends value undefined is not a function or null`.

Instead either do a [partial mock](https://jestjs.io/docs/mock-functions#mocking-partials),
or better [mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) on your
endpoints.

:::

If you need to add unit tests to your components to check some behavior you might want
avoid dealing with network fetch cycle as that is probably orthogonal to what your are
trying to test. Using [&lt;DataProvider /\>](../api/DataProvider.md) with [mockInitialState](../api/mockInitialState.md) and [Fixtures](../api/Fixtures.md) in our tests allow
us to prime the cache with provided fixtures so the components will immediately render
with said results.

Testing user interactions that trigger mutations can be aided with the use of [&lt;MockResolver /\>](../api/MockResolver.md)
and [Interceptors](../api/Fixtures.md#interceptor)

```typescript title="__tests__/fixtures.ts"
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
    const content = findByText(results.full.result[0].content);
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

    await waitFor(expect(findByText(results.full.result[0].content)).toBeDefined());
  })
});
```
