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

[Storybook](https://storybook.js.org/) es una gran utilidad para desarrollar y probar
de forma aislada, lo que puede acelerar enormemente el desarrollo.

[&lt;MockResolver /\>](../api/MockResolver.md) permite cargar fácilmente [fixtures o interceptors](../api/Fixtures.md) para ver cómo
podrían verse distintas respuestas de red. Se puede anidar, componer e incluso usar
para [fetches imperativos](../api/Controller.md#fetch) que normalmente se usan con endpoints con efectos secundarios como [getList.push](/rest/api/resource#push) y [update](/rest/api/resource#update).

## Configuración {#setup}

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

Probaremos tres casos con nuestros [fixtures e interceptors](../api/Fixtures.md): algunos resultados interesantes en la lista, una lista vacía y datos que
no existen, de modo que se muestre el fallback de carga.

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

Deberás agregar los [decorators globales](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators) apropiados para establecer el contexto correcto.

Esto debería parecerse a lo que agregaste en la [configuración inicial](../getting-started/installation#add-provider-at-top-level-component)

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

Envolver nuestro componente con [&lt;MockResolver /\>](../api/MockResolver.md) nos permite controlar de forma declarativa
cómo se resuelven los fetch de Reactive Data Client.

Aquí seleccionamos qué fixtures se usarán mediante los [controles de storybook](https://storybook.js.org/docs/react/essentials/controls).

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
