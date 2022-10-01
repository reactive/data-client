---
title: Mocking data for Storybook
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[Storybook](https://storybook.js.org/) is a great utility to do isolated development and
testing, potentially speeding up development time greatly.

[<MockResolver /\>](../api/MockResolver.md) enables easy loading of fixtures to see what
different network responses might look like. It can be layered, composed, and even used
for [imperative fetches](../api/Controller.md#fetch) usually used with side-effect endpoints like [create](/rest/api/createResource#create) and [update](/rest/api/createResource#update).

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
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
}
export const ArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});

export let ArticleFixtures: Record<string, FixtureEndpoint> = {};
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

We'll test three cases: some interesting results in the list, an empty list, and data not
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

Wrapping our component with [<MockResolver /\>](../api/MockResolver.md) enables us to declaratively
control how Rest Hooks' fetches are resolved.

Here we select which fixtures should be used by [storybook controls](https://storybook.js.org/docs/react/essentials/controls).

```tsx title="ArticleList.stories.tsx"
import { MockResolver } from '@rest-hooks/test';
import type { Fixture } from '@rest-hooks/test';
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
