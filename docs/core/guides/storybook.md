---
title: Mocking data for Storybook
---

<head>
  <title>Mocking data for Storybook</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[Storybook](https://storybook.js.org/) is a great utility to do isolated development and
testing, potentially speeding up development time greatly.

[&lt;MockResolver /\>](../api/MockResolver.md) enables easy loading of [fixtures or interceptors](../api/Fixtures.md) to see what
different network responses might look like. It can be layered, composed, and even used
for [imperative fetches](../api/Controller.md#fetch) usually used with side-effect endpoints like [getList.push](/rest/api/createResource#push) and [update](/rest/api/createResource#update).

## Setup

<Tabs
defaultValue="ArticleResource.ts"
values={[
{ label: 'Resource', value: 'ArticleResource.ts' },
{ label: 'Component', value: 'ArticleList.tsx' },
]}>
<TabItem value="ArticleResource.ts">

```typescript title="ArticleResource.ts"
export class Article extends Entity {
  id: number | undefined = undefined;
  content = '';
  author: number | null = null;
  contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
  static key = 'Article';
}
export const ArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});

export let ArticleFixtures: Record<string, Fixture> = {};
```

</TabItem>
<TabItem value="ArticleList.tsx">

```tsx title="ArticleList.tsx"
import { ArticleResource } from 'resources/ArticleResource';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({ maxResults }: { maxResults: number }) {
  const articles = useSuspense(ArticleResource.getList, { maxResults });
  return (
    <div>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </div>
  );
}
```

</TabItem>
</Tabs>

## Fixtures

We'll test three cases with our [fixtures and interceptors](../api/Fixtures.md): some interesting results in the list, an empty list, and data not
existing so loading fallback is shown.

```typescript title="ArticleResource.ts"
// leave out in production so we don't bloat the bundle
if (process.env.NODE_ENV !== 'production') {
  ArticleFixtures = {
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
        response: ({ id }, body) => ({
          ...body,
          id,
        }),
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
}
```

## Decorators

You'll need to add the appropriate [global decorators](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators) to establish the correct context.

This should resemble what you have added in [initial setup](../getting-started/installation#add-provider-at-top-level-component)

```tsx title=".storybook/preview.tsx"
import { Suspense } from 'react';
import { CacheProvider, AsyncBoundary } from '@data-client/react';

export const decorators = [
  Story => (
    <CacheProvider>
      <AsyncBoundary>
        <Story />
      </AsyncBoundary>
    </CacheProvider>
  ),
];
```

## Story

Wrapping our component with [&lt;MockResolver /\>](../api/MockResolver.md) enables us to declaratively
control how Reactive Data Client' fetches are resolved.

Here we select which fixtures should be used by [storybook controls](https://storybook.js.org/docs/react/essentials/controls).

```tsx title="ArticleList.stories.tsx"
import { MockResolver } from '@data-client/test';
import type { Fixture } from '@data-client/test';
import { Story } from '@storybook/react/types-6-0';

import ArticleList from 'ArticleList';
import { ArticleFixtures } from 'resources/ArticleResource';

export default {
  title: 'Pages/ArticleList',
  component: ArticleList,
  argTypes: {
    result: {
      description: 'Results',
      defaultValue: 'full',
      control: {
        type: 'select',
        options: Object.keys(ArticleFixtures),
      },
    },
  },
};

const Template: Story<{ result: keyof typeof options }> = ({ result }) => (
  // highlight-next-line
  <MockResolver fixtures={options[result]}>
    <ArticleList maxResults={10} />
    // highlight-next-line
  </MockResolver>
);

export const FullArticleList = Template.bind({});

FullArticleList.args = {
  result: 'full',
};
```
