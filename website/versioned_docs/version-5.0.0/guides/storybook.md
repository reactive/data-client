---
title: Mocking data for Storybook
id: version-5.0.0-storybook
original_id: storybook
---

[Storybook](https://storybook.js.org/) is a great utility to do isolated development and
testing, potentially speeding up development time greatly.

[\<MockResolver />](../api/MockResolver.md) enables easy loading of fixtures to see what
different network responses might look like. It can be layered, composed, and even used
for [imperative fetches](../api/useFetcher) like [create](../api/resource#create-endpoint) and [update](../api/resource#update-endpoint).

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
  const articles = useResource(ArticleResource.list(), { maxResults });
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
      request: ArticleResource.list(),
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
    {
      request: ArticleResource.update(),
      params: { id: 532 },
      result: {
        id: 532,
        content: 'updated "never again"',
        author: 23,
        contributors: [5],
      },
    },
  ],
  empty: [
    {
      request: ArticleResource.list(),
      params: { maxResults: 10 },
      result: [],
    },
  ],
  error: [
    {
      request: ArticleResource.list(),
      params: { maxResults: 10 },
      result: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
  loading: [],
};
```

## Decorators

You'll need to add the appropriate [global decorators](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators) to establish the correct context.

This should resemble what you have added in [initial setup](../getting-started/installation#add-provider-at-top-level-component)

#### `.storybook/preview.tsx`

```tsx
import { Suspense } from 'react';
import { CacheProvider, NetworkErrorBoundary } from 'rest-hooks';

export const decorators = [
  Story => (
    <CacheProvider>
      <Suspense fallback="loading">
        <NetworkErrorBoundary>
          <Story />
        </NetworkErrorBoundary>
      </Suspense>
    </CacheProvider>
  ),
];
```

## Story

Wrapping our component with <MockResolver /> enables us to declaratively
control how Rest Hooks' fetches are resolved.

Here we select which fixtures should be used by [storybook controls](https://storybook.js.org/docs/react/essentials/controls).

#### `ArticleList.stories.tsx`

```tsx
import { MockResolver } from '@rest-hooks/test';
import type { Fixture } from '@rest-hooks/test';
import { Story } from '@storybook/react/types-6-0';

import ArticleList from 'ArticleList';
import options from './fixtures';

export default {
  title: 'Pages/ArticleList',
  component: ArticleList,
  argTypes: {
    result: {
      description: 'Results',
      defaultValue: 'full',
      control: {
        type: 'select',
        options: Object.keys(options),
      },
    },
  },
};

const Template: Story<{ result: keyof typeof options }> = ({ result }) => (
  <MockResolver fixtures={options[result]}>
    <ArticleList maxResults={10} />
  </MockResolver>
);

export const FullArticleList = Template.bind({});

FullArticleList.args = {
  result: 'full',
};
```
