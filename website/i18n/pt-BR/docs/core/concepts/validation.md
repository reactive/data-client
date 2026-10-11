---
title: Validando respostas de fetch no React
vue_title: Validando respostas de fetch no Vue
sidebar_label: Validação
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Validação da API

[Entity.validate()](/rest/api/Entity#validate) é chamado durante a normalização e a desnormalização.
`undefined` indica que não há erro, e uma string com a mensagem de erro indica que há um erro.

## Verificação de campo {#field-check}

A validação acontece depois de [Entity.process()](/rest/api/Entity#process), mas antes de [Entity.fromJS()](/rest/api/Entity#fromJS),
e portanto opera sobre POJOs, e não sobre uma instância da classe.

Aqui podemos garantir que o campo title esteja presente e seja do tipo esperado.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 1 }],
response: { id: '1', title: 'first' },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 2 }],
response: { id: '2' },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 3 }],
response: { id: '3', title: { complex: 'second', object: 5 } },
delay: 150,
},
]}>

```typescript title="api/Article"
import { Entity, RestEndpoint } from '@data-client/rest';

export class Article extends Entity {
  id = '';
  title = '';

  static validate(processedEntity) {
    if (!Object.hasOwn(processedEntity, 'title')) return 'missing title field';
    if (typeof processedEntity.title !== 'string') return 'title is wrong type';
  }
}

export const getArticle = new RestEndpoint({
  path: '/article/:id',
  schema: Article,
});
```

:::react

```tsx title="ArticlePage" collapsed
import { useSuspense } from '@data-client/react';
import { getArticle } from './api/Article';

function ArticlePage({ id }: { id: string }) {
  const article = useSuspense(getArticle, { id });
  return <div>{article.title}</div>;
}

render(<ArticlePage id="2" />);
```

:::

:::vue

```html title="ArticlePage.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getArticle } from './api/Article';

  const article = await useSuspense(getArticle, { id: '2' });
</script>

<template>
  <div>{{ article.title }}</div>
</template>
```

:::

</FrameworkPlayground>

### Verificação de todos os campos {#all-fields-check}

[validateRequired()](/rest/api/validateRequired) pode ser usado para verificar se todos os campos definidos estão presentes.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 1 }],
response: { id: '1', title: 'first' },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 2 }],
response: { id: '2' },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 3 }],
response: { id: '3', title: { complex: 'second', object: 5 } },
delay: 150,
},
]}>

```tsx title="api/Article"
import { Entity, RestEndpoint, validateRequired } from '@data-client/rest';

export class Article extends Entity {
  id = '';
  title = '';

  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults);
  }
}

export const getArticle = new RestEndpoint({
  path: '/article/:id',
  schema: Article,
});
```

:::react

```tsx title="ArticlePage" collapsed
import { useSuspense } from '@data-client/react';
import { getArticle } from './api/Article';

function ArticlePage({ id }: { id: string }) {
  const article = useSuspense(getArticle, { id });
  return <div>{article.title}</div>;
}

render(<ArticlePage id="2" />);
```

:::

:::vue

```html title="ArticlePage.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getArticle } from './api/Article';

  const article = await useSuspense(getArticle, { id: '2' });
</script>

<template>
  <div>{{ article.title }}</div>
</template>
```

:::

</FrameworkPlayground>

## Resultados parciais {#partial-results}

Outro ótimo uso da validação é combinar endpoints que retornam [objetos incompletos](/rest/guides/partial-entities). Isso costuma ser
útil quando alguns campos consomem muita banda ou são computacionalmente caros para o backend.

Considere usar [validateRequired](/rest/api/validateRequired) para reduzir código.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/article'}),
args: [],
response: [
{ id: '1', title: 'first' },
{ id: '2', title: 'second' },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 1 }],
response: {
id: '1',
title: 'first',
content: 'long',
createdAt: '2011-10-05T14:48:00.000Z',
},
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/article/:id'}),
args: [{ id: 2 }],
response: {
id: '2',
title: 'second',
content: 'short',
createdAt: '2011-10-05T14:48:00.000Z',
},
delay: 150,
},
]}>

```typescript title="api/Article"
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class ArticlePreview extends Entity {
  id = '';
  title = '';

  static key = 'Article';
}
export const getArticleList = new RestEndpoint({
  path: '/article',
  schema: [ArticlePreview],
});

export class ArticleFull extends ArticlePreview {
  content = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    createdAt: Temporal.Instant.from,
  };

  static validate(processedEntity) {
    if (!Object.hasOwn(processedEntity, 'content')) return 'Missing content';
  }
}

export const getArticle = new RestEndpoint({
  path: '/article/:id',
  schema: ArticleFull,
});
```

:::react

```tsx title="ArticleDetail" collapsed
import React from 'react';
import { useSuspense } from '@data-client/react';
import { getArticle, getArticleList } from './api/Article';

function ArticleDetail({ id, onHome }: { id: string; onHome: () => void }) {
  const article = useSuspense(getArticle, { id });
  return (
    <div>
      <h4>
        <a onClick={onHome} style={{ cursor: 'pointer' }}>
          &lt;
        </a>{' '}
        {article.title}
      </h4>
      <div>
        <p>{article.content}</p>
        <div>
          Created:{' '}
          <time>
            {article.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}
          </time>
        </div>
      </div>
    </div>
  );
}
function ArticleList() {
  const [route, setRoute] = React.useState('');
  const articles = useSuspense(getArticleList);
  if (!route) {
    return (
      <div>
        {articles.map(article => (
          <div
            key={article.pk()}
            onClick={() => setRoute(article.id)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Click me: {article.title}
          </div>
        ))}
      </div>
    );
  }
  return <ArticleDetail id={route} onHome={() => setRoute('')} />;
}

render(<ArticleList />);
```

:::

:::vue

```html title="ArticleDetail.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getArticle } from './api/Article';

  const props = defineProps<{ id: string }>();
  const emit = defineEmits<{ home: [] }>();
  const article = await useSuspense(getArticle, () => ({ id: props.id }));
</script>

<template>
  <div>
    <h4>
      <a @click="emit('home')" style="cursor: pointer">&lt;</a>
      {{ article.title }}
    </h4>
    <div>
      <p>{{ article.content }}</p>
      <div>
        Created:
        <time>
          {{ article.createdAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
        </time>
      </div>
    </div>
  </div>
</template>
```

```html title="ArticleList.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { getArticleList } from './api/Article';
  import ArticleDetail from './ArticleDetail.vue';

  const route = ref('');
  const articles = await useSuspense(getArticleList);
</script>

<template>
  <Suspense v-if="route">
    <ArticleDetail :id="route" @home="route = ''" />
    <template #fallback><div>loading...</div></template>
  </Suspense>
  <div v-else>
    <div
      v-for="article in articles"
      :key="article.pk()"
      @click="route = article.id"
      style="cursor: pointer; text-decoration: underline"
    >
      Click me: {{ article.title }}
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>
