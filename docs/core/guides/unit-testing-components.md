---
title: Unit testing components
---

:::danger

Do *not* use jest.mock on any rest-hooks library. This will likely result in hard-to trace
errors like `TypeError: Class extends value undefined is not a function or null`.

:::

If you need to add unit tests to your components to check some behavior you might want
avoid dealing with network fetch cycle as that is probably orthogonal to what your are
trying to test. Using [<MockResolver /\>](../api/MockResolver) in our tests allow
us to prime the cache with provided fixtures so the components will immediately render
with said results.

```typescript title="__tests__/fixtures.ts"
export default {
  full: [
    {
      endpoint: ArticleResource.list(),
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
      endpoint: ArticleResource.update(),
      args: [{ id: 532 }] as const,
      response: {
        id: 532,
        content: 'updated "never again"',
        author: 23,
        contributors: [5],
      },
    },
  ],
  empty: [
    {
      endpoint: ArticleResource.list(),
      args: [{ maxResults: 10 }] as const,
      response: [],
    },
  ],
  error: [
    {
      endpoint: ArticleResource.list(),
      args: [{ maxResults: 10 }] as const,
      response: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
  loading: [],
};
```

```tsx title="__tests__/ArticleList.tsx"
import { CacheProvider } from 'rest-hooks';
import { render } from '@testing-library/react';
import { MockResolver } from '@rest-hooks/test';

import ArticleList from 'components/ArticleList';
import results from './fixtures';

describe('<ArticleList />', () => {
  it('renders', () => {
    const tree = (
      <CacheProvider initialState={mockInitialState(results.full)}>
        <ArticleList maxResults={10} />
      </CacheProvider>
    );
    const { queryByText } = render(tree);
    const content = queryByText(results.full.result[0].content);
    expect(content).toBeDefined();
  });

  it('suspends then resolves', async () => {
    const tree = (
      <CacheProvider>
        <MockResolver fixtures={results.full}>
          <Suspense fallback="loading">
            <ArticleList maxResults={10} />
          </Suspense>
        </MockResolver>
      </CacheProvider>
    );
    const { queryByText, waitForNextUpdate } = render(tree);
    expect(queryByText('loading')).toBeDefined();

    await waitForNextUpdate();
    expect(queryByText(results.full.result[0].content)).toBeDefined();
  })
});
```
