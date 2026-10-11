---
frameworks: [react]
title: Simulando dados para o Storybook
sidebar_label: Simulando dados para o Storybook
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Simulando dados para o Storybook

O [Storybook](https://storybook.js.org/) é uma ótima ferramenta para desenvolvimento e
testes isolados, podendo acelerar bastante o tempo de desenvolvimento.

O [&lt;MockResolver /\>](../api/MockResolver.md) permite carregar com facilidade [fixtures ou interceptors](../api/Fixtures.md) para ver como
diferentes respostas de rede podem se parecer. Ele pode ser aninhado, composto e até usado
para [fetches imperativos](../api/Controller.md#fetch), geralmente usados com endpoints que têm efeitos colaterais, como [getList.push](/rest/api/resource#push) e [update](/rest/api/resource#update).

## Configuração {#setup}

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

Vamos testar três casos com nossos [fixtures e interceptors](../api/Fixtures.md): alguns resultados interessantes na lista, uma lista vazia e dados
inexistentes, de modo que o fallback de carregamento seja exibido.

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

Você precisará adicionar os [decorators globais](https://storybook.js.org/docs/react/writing-stories/decorators#global-decorators) apropriados para estabelecer o contexto correto.

Isso deve se parecer com o que você adicionou na [configuração inicial](../getting-started/installation#add-provider-at-top-level-component)

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

Envolver nosso componente com o [&lt;MockResolver /\>](../api/MockResolver.md) nos permite controlar
de forma declarativa como os fetches do Reactive Data Client são resolvidos.

Aqui selecionamos quais fixtures devem ser usados pelos [controles do storybook](https://storybook.js.org/docs/react/essentials/controls).

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
