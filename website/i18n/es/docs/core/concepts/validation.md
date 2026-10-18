---
title: Validación de respuestas de fetch en React
vue_title: Validación de respuestas de fetch en Vue
sidebar_label: Validation
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Validación de la API

[Entity.validate()](/rest/api/Entity#validate) se llama durante la normalización y la desnormalización.
`undefined` indica que no hay error, y se devuelve un mensaje de error en forma de string si lo hay.

## Comprobación de campos {#field-check}

La validación ocurre después de [Entity.process()](/rest/api/Entity#process) pero antes de [Entity.fromJS()](/rest/api/Entity#fromJS),
por lo que opera sobre POJOs en lugar de sobre una instancia de la clase.

Aquí podemos asegurarnos de que el campo title esté incluido y sea del tipo esperado.

<FrameworkPlayground row fixtures={[
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

### Comprobación de todos los campos {#all-fields-check}

[validateRequired()](/rest/api/validateRequired) se puede usar para comprobar que todos los campos definidos estén presentes.

<FrameworkPlayground row fixtures={[
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

## Resultados parciales {#partial-results}

Otro gran uso de la validación es combinar endpoints que devuelven [objetos incompletos](/rest/guides/partial-entities). Esto suele ser
útil cuando algunos campos consumen mucho ancho de banda o son costosos de calcular para el backend.

Considera usar [validateRequired](/rest/api/validateRequired) para reducir código.

<FrameworkPlayground row fixtures={[
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

```tsx title="ArticleList" route="/" collapsed
import { useSuspense } from '@data-client/react';
import { getArticleList } from './api/Article';

export default function ArticleList() {
  const articles = useSuspense(getArticleList);
  return (
    <div>
      {articles.map(article => (
        <div key={article.pk()}>
          <Link to={`/articles/${article.id}`}>Click me: {article.title}</Link>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="ArticleDetail" route="/articles/:id" collapsed
import { useSuspense } from '@data-client/react';
import { getArticle } from './api/Article';

export default function ArticleDetail({ id }: { id: string }) {
  const article = useSuspense(getArticle, { id });
  return (
    <div>
      <h4>{article.title}</h4>
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
```

:::

:::vue

```html title="ArticleList.vue" route="/" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getArticleList } from './api/Article';

  const articles = await useSuspense(getArticleList);
</script>

<template>
  <div>
    <div v-for="article in articles" :key="article.pk()">
      <RouterLink :to="`/articles/${article.id}`">
        Click me: {{ article.title }}
      </RouterLink>
    </div>
  </div>
</template>
```

```html title="ArticleDetail.vue" route="/articles/:id" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getArticle } from './api/Article';

  const props = defineProps<{ id: string }>();
  const article = await useSuspense(getArticle, () => ({ id: props.id }));
</script>

<template>
  <div>
    <h4>{{ article.title }}</h4>
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

:::

</FrameworkPlayground>
