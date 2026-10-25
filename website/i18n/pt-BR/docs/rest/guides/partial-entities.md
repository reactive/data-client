---
title: Entities parciais
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { Collection, RestEndpoint } from '@data-client/rest';
import Grid from '@site/src/components/Grid';

Às vezes você tem um [endpoint de lista](../api/resource.md#getlist) cujas entities incluem apenas
um subconjunto dos campos necessários para resumir.

<Grid>

```json title="ArticleSummary"
{
  "id": "1",
  "title": "first"
}
```

```json title="Article"
{
  "id": "1",
  "title": "first",
  "content": "Imagine there was much more here.",
  "createdAt": "2011-10-05T14:48:00.000Z"
}
```

</Grid>

Nesse caso, podemos sobrescrever [Entity.validate()](../api/Entity.md#validate) usando [validateRequired()](../api/validateRequired.md) para garantir
que temos a resposta completa quando necessário (views de detalhe), mantendo nosso estado [DRY](https://deviq.com/principles/dont-repeat-yourself) e normalizado para assegurar a integridade dos dados.

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
]} row>

```typescript title="resources/Article" {13,25}
import { validateRequired, Collection, Entity, resource } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class ArticleSummary extends Entity {
  id = '';
  title = '';

  // this ensures `Article` maps to the same entity
  static key = 'Article';

  static schema = {
    createdAt: Temporal.Instant.from,
  };
}

export class Article extends ArticleSummary {
  content = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults);
  }
}

export const ArticleResource = resource({
  path: '/article/:id',
  schema: Article,
}).extend({
  getList: {
    schema: new Collection([ArticleSummary]),
  },
});
```

:::react

```tsx title="ArticleList" route="/" collapsed
import { useSuspense } from '@data-client/react';
import { ArticleResource } from './resources/Article';

export default function ArticleList() {
  const articles = useSuspense(ArticleResource.getList);
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
import { ArticleResource } from './resources/Article';

export default function ArticleDetail({ id }: { id: string }) {
  const article = useSuspense(ArticleResource.get, { id });
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
  import { ArticleResource } from './resources/Article';

  const articles = await useSuspense(ArticleResource.getList);
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
  import { ArticleResource } from './resources/Article';

  const props = defineProps<{ id: string }>();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
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

## Dados de detalhe em uma entity aninhada {#detail-data-in-nested-entity}

Muitas vezes é melhor mover os dados custosos para outra entity, simplificando a lógica
condicional.

```typescript title="resources/Article.ts"
class ArticleSummary extends Entity {
  id = '';
  title = '';
  content = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    createdAt: Temporal.Instant.from,
    meta: ArticleMeta,
  };

  // this ensures `Article` maps to the same entity
  // highlight-next-line
  static key = 'Article';
}

class Article extends ArticleSummary {
  // highlight-start
  meta = ArticleMeta.fromJS();

  static validate(processedEntity) {
    // highlight-next-line
    return validateRequired(processedEntity, this.defaults);
  }
}

class ArticleMeta extends Entity {
  viewCount = 0;
  likeCount = 0;
  relatedArticles: ArticleSummary[] = [];

  static schema = {
    relatedArticles: [ArticleSummary],
  };
}

const ArticleResource = resource({
  path: '/article/:id',
  schema: Article,
}).extend({
  getList: { schema: new Collection([ArticleSummary]) },
});
```
