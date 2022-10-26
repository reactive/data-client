---
title: Mocking data for Storybook
id: storybook
original_id: storybook
---

[Storybook](https://storybook.js.org/) is a great utility to do isolated development and
testing, potentially speeding up development time greatly.

[\<MockProvider /\>](../api/MockProvider.md) enables easy loading of fixtures to test the
happy path of components. Loading state is bypassed by initializing the cache ahead of time.

## Setup

<!--DOCUSAURUS_CODE_TABS-->
<!--ArticleResource.ts-->

```typescript
export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'http://test.com/article/';
}
```

<!--ArticleList.tsx-->

```tsx
import ArticleResource from 'resources/ArticleResource';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({ maxResults }: { maxResults: number }) {
  const articles = useResource(ArticleResource.listShape(), { maxResults });
  return (
    <div>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </div>
  );
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

## Fixtures

We'll test three cases: some interesting results in the list, an empty list, and data not
existing so loading fallback is shown.

#### `fixtures.ts`

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

## Story

We use a [storybook knob](https://www.npmjs.com/package/@storybook/addon-knobs)
to make it easy for the user to select between each dataset to compare how it looks.

#### `ArticleListStory.tsx`

```tsx
import { select } from '@storybook/addon-knobs';
import { MockProvider } from '@rest-hooks/test';
import ArticleList from 'ArticleList';
import options from './fixtures';

const label = 'Data';
const defaultValue = options.full;
const groupId = 'GROUP-ID1';

storiesOf('name', module).add('Name', () => {
  const results = select(label, options, defaultValue, groupId);
  return (
    <MockProvider results={results}>
      <ArticleList maxResults={10} />
    </MockProvider>
  );
});
```
