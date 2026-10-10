---
title: 部分 Entity
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { Collection, RestEndpoint } from '@data-client/rest';
import Grid from '@site/src/components/Grid';

有时你的[列表 endpoint](../api/resource.md#getlist) 返回的 Entity 只包含
用于概要展示的部分字段。

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

这种情况下，我们可以借助 [validateRequired()](../api/validateRequired.md) 重写 [Entity.validate()](../api/Entity.md#validate)，确保
在需要时（详情视图）拿到完整的响应，同时让状态保持 [DRY](https://deviq.com/principles/dont-repeat-yourself) 并经过规范化，以确保数据完整性。

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

```tsx title="ArticleDetail" collapsed
import React from 'react';
import { useSuspense } from '@data-client/react';
import { ArticleResource } from './resources/Article';

function ArticleDetail({ id, onHome }: Props) {
  const article = useSuspense(ArticleResource.get, { id });
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
interface Props {
  id: string;
  onHome: () => void;
}
function ArticleList() {
  const [route, setRoute] = React.useState('');
  const articles = useSuspense(ArticleResource.getList);
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
  import { ArticleResource } from './resources/Article';

  const props = defineProps<{ id: string }>();
  const emit = defineEmits<{ home: [] }>();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
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
  import { ArticleResource } from './resources/Article';
  import ArticleDetail from './ArticleDetail.vue';

  const route = ref('');
  const articles = await useSuspense(ArticleResource.getList);
</script>

<template>
  <div v-if="!route">
    <div
      v-for="article in articles"
      :key="article.pk()"
      @click="route = article.id"
      style="cursor: pointer; text-decoration: underline"
    >
      Click me: {{ article.title }}
    </div>
  </div>
  <ArticleDetail v-else :id="route" @home="route = ''" />
</template>
```

:::

</FrameworkPlayground>

## 将详情数据放在嵌套 Entity 中 {#detail-data-in-nested-entity}

通常更好的做法是把开销大的数据移到另一个 Entity 中，以简化条件
逻辑。

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
