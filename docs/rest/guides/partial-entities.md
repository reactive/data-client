---
title: Partial Entities
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { Collection, RestEndpoint } from '@data-client/rest';
import Grid from '@site/src/components/Grid';

Sometimes you have a [list endpoint](../api/resource.md#getlist) whose entities only include
a subset of fields needed to summarize.

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

In this case we can override [Entity.validate()](../api/Entity.md#validate) using [validateRequired()](../api/validateRequired.md) to ensure
we have the full and complete response when needed (detail views), while keeping our state [DRY](https://deviq.com/principles/dont-repeat-yourself) and normalized to ensure data integrity.

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

## Detail data in nested entity

It's often better to move expensive data into another entity to simplify conditional
logic.

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
