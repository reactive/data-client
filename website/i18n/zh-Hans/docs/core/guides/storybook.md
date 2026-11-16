---
frameworks: [react]
title: 为 Storybook 模拟数据
sidebar_label: 为 Storybook 模拟数据
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 为 Storybook 模拟数据

[Storybook](https://storybook.js.org/) 可以隔离地渲染组件，用于开发和测试。

[&lt;MockResolver /\>](../api/MockResolver.md) 会加载 [fixture 或 interceptor](../api/Fixtures.md)，让 story 展示
不同的网络响应。嵌套一个 `<MockResolver>` 可以覆盖树中某一部分的 fixture。在它内部，
只有内层的 fixture 生效：它们没有匹配的请求会发往网络，而不是交给外层的 fixture。它还会解析带副作用的
endpoint 的[命令式获取](../api/Controller.md#fetch)，例如 [getList.push](/rest/api/resource#push) 和 [update](/rest/api/resource#update)。

## 设置 {#setup}

<Tabs
defaultValue="ArticleResource.ts"
values={[
{ label: 'Resource', value: 'ArticleResource.ts' },
{ label: 'Component', value: 'ArticleList.tsx' },
]}>
<TabItem value="ArticleResource.ts">

```typescript title="ArticleResource.ts"
import { Entity, resource } from '@data-client/rest';
import type { Fixture } from '@data-client/test';

export class Article extends Entity {
  id: number | undefined = undefined;
  content = '';
  author: number | null = null;
  contributors: number[] = [];

  static key = 'Article';
}
export const ArticleResource = resource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
  searchParams: {} as { maxResults: number },
});

export let ArticleFixtures: Record<string, Fixture[]> = {};
```

</TabItem>
<TabItem value="ArticleList.tsx">

```tsx title="ArticleList.tsx"
import { useSuspense } from '@data-client/react';
import { ArticleResource } from 'resources/ArticleResource';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({
  maxResults,
}: {
  maxResults: number;
}) {
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

## Fixtures {#fixtures}

这些 [fixture 和 interceptor](../api/Fixtures.md) 涵盖四种情况：完整的列表、空列表、错误，以及没有
fixture（此时会一直显示加载 fallback）。

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
        response: {
          message: 'Bad request',
          status: 400,
          name: 'Not Found',
        },
        error: true,
      },
    ],
    loading: [],
  };
}
```

## 装饰器 {#decorators}

添加[全局装饰器](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators)，让它们渲染
与你应用的[初始设置](../getting-started/installation#add-provider-at-top-level-component)相同的 provider：

```tsx title=".storybook/preview.tsx"
import { DataProvider, AsyncBoundary } from '@data-client/react';

export const decorators = [
  Story => (
    <DataProvider>
      <AsyncBoundary>
        <Story />
      </AsyncBoundary>
    </DataProvider>
  ),
];
```

## Story {#story}

用 [&lt;MockResolver /\>](../api/MockResolver.md) 包裹组件，以选择它的请求如何解析。这里由
[Storybook controls](https://storybook.js.org/docs/react/essentials/controls) 选择 fixture。

```tsx title="ArticleList.stories.tsx"
import { type StoryObj } from '@storybook/react';
import { MockResolver } from '@data-client/test';
import type { Fixture } from '@data-client/test';

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

export const FullArticleList: StoryObj<{ result: keyof typeof ArticleFixtures }> =
  {
    render: ({ result }) => (
      // highlight-next-line
      <MockResolver fixtures={ArticleFixtures[result]}>
        <ArticleList maxResults={10} />
        // highlight-next-line
      </MockResolver>
    ),
    args: { result: 'full' },
  };
```
