---
frameworks: [react]
title: Simular datos para Storybook
sidebar_label: Simular datos para Storybook
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Simular datos para Storybook

[Storybook](https://storybook.js.org/) renderiza componentes de forma aislada para desarrollar y probar.

[&lt;MockResolver /\>](../api/MockResolver.md) carga [fixtures o interceptors](../api/Fixtures.md), de modo que las stories muestran
distintas respuestas de red. Anida un `<MockResolver>` para reemplazar los fixtures de una parte del árbol. Dentro de él,
solo se aplican los fixtures internos: una petición que no coincida con ellos va a la red, no a los fixtures del externo. También resuelve los [fetches imperativos](../api/Controller.md#fetch) de endpoints
con efectos secundarios, como [getList.push](/rest/api/resource#push) y [update](/rest/api/resource#update).

## Configuración {#setup}

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

Estos [fixtures e interceptors](../api/Fixtures.md) cubren cuatro casos: una lista completa, una lista vacía, un error y ningún
fixture, lo que deja visible el fallback de carga.

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

## Decorators {#decorators}

Agrega [decorators globales](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators) que rendericen
los mismos providers que la [configuración inicial](../getting-started/installation#add-provider-at-top-level-component) de tu aplicación:

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

Envuelve el componente en [&lt;MockResolver /\>](../api/MockResolver.md) para elegir cómo se resuelven sus fetches. Aquí
los [controles de Storybook](https://storybook.js.org/docs/react/essentials/controls) eligen los fixtures.

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
