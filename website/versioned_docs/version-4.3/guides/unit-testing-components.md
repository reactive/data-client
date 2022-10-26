---
id: unit-testing-components
title: Unit testing components
original_id: unit-testing-components
---

If you need to add unit tests to your components to check some behavior you might want
avoid dealing with network fetch cycle as that is probably orthogonal to what your are
trying to test. Using [\<MockProvider /\>](../api/MockProvider.md) in our tests allow
us to prime the cache with provided fixtures so the components will immediately render
with said results.

#### `__tests__/fixtures.ts`

```typescript
export default {
  full: [
    {
      request: ArticleResource.listShape(),
      params: { maxResults: 10 },
      result: [
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
  ],
  empty: [
    {
      request: ArticleResource.listShape(),
      params: { maxResults: 10 },
      result: [],
    },
  ],
  loading: [],
};
```

#### `__tests__/ArticleList.tsx`

```tsx
import { render } from '@testing-library/react';
import { MockProvider } from '@rest-hooks/test';

import ArticleList from 'components/ArticleList';
import results from './fixtures';

describe('<ArticleList />', () => {
  it('renders', () => {
    const tree = (
      <MockProvider results={results.full}>
        <ArticleList maxResults={10} />
      </MockProvider>
    );
    const { queryByText } = render(tree);
    const content = queryByText(results.full.result[0].content);
    expect(content).toBeDefined();
  });
});
```
