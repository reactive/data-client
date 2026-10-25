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

[Storybook](https://storybook.js.org/) 是一个用于隔离开发和测试的优秀工具，
有望大幅缩短开发时间。

[&lt;MockResolver /\>](../api/MockResolver.md) 可以轻松加载 [fixture 或 interceptor](../api/Fixtures.md)，以查看
不同的网络响应会呈现什么样子。它可以分层、组合，甚至可以用于
[命令式获取](../api/Controller.md#fetch)，这通常用于带副作用的 endpoint，例如 [getList.push](/rest/api/resource#push) 和 [update](/rest/api/resource#update)。

## 设置 {#setup}

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

我们将用 [fixture 和 interceptor](../api/Fixtures.md) 测试三种情况：列表中有一些有意义的结果、列表为空，以及数据
不存在从而显示加载 fallback。

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

你需要添加合适的[全局装饰器](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators)来建立正确的 context。

这应当与你在[初始设置](../getting-started/installation#add-provider-at-top-level-component)中添加的内容类似

```tsx title=".storybook/preview.tsx"
import { Suspense } from 'react';
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

用 [&lt;MockResolver /\>](../api/MockResolver.md) 包裹组件，我们就可以声明式地
控制 Reactive Data Client 的请求如何被解析。

这里我们通过 [storybook controls](https://storybook.js.org/docs/react/essentials/controls) 选择要使用的 fixture。

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
