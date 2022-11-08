---
id: README
title: REST Usage
sidebar_label: Usage
---

<head>
  <title>Using REST APIs with Rest Hooks</title>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';

<PkgTabs pkgs="@rest-hooks/rest" />

## Define the API

<LanguageTabs>

```typescript title="api/Article.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class Article extends Entity {
  id: number | undefined = undefined;
  title = '';
  content = '';
  author: number | null = null;
  tags: string[] = [];

  pk() {
    return this.id?.toString();
  }
}

export const ArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
```

```js title="api/Article.js"
import { Entity, createResource } from '@rest-hooks/rest';

export class Article extends Entity {
  id = undefined;
  title = '';
  content = '';
  author = null;
  tags = [];

  pk() {
    return this.id?.toString();
  }
}
export const ArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
```

</LanguageTabs>

Our definitions are composed of two pieces. Our data model defined by [Schema](api/schema.md) and the
networking endpoints defined by [RestEndpoint](api/RestEndpoint.md).

## Bind the data with Suspense

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useSuspense } from 'rest-hooks';
import { ArticleResource } from 'api/article';

export default function ArticleDetail({ id }: { id: number }) {
  const article = useSuspense(ArticleResource.get, { id });
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
    </article>
  );
}
```

</TabItem>
<TabItem value="List">

```tsx
import { useSuspense } from 'rest-hooks';
import { ArticleResource } from 'api/article';
import ArticleSummary from './ArticleSummary';

export default function ArticleList() {
  const articles = useSuspense(ArticleResource.getList);
  return (
    <section>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </section>
  );
}
```

</TabItem>
</Tabs>

[useSuspense()](/docs/api/useSuspense) guarantees access to data with sufficient [freshness](api/RestEndpoint.md#dataexpirylength).
This means it may issue network calls, and it may [suspend](/docs/getting-started/data-dependency#async-fallbacks) until the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [endpoints](api/RestEndpoint.md).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

## Mutate the data

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```tsx title="article.tsx"
import { useController } from 'rest-hooks';
import { ArticleResource } from 'api/article';

export default function NewArticleForm() {
  const controller = useController();
  return (
    <Form
      onSubmit={e =>
        controller.fetch(ArticleResource.create, new FormData(e.target))
      }
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[create](api/createResource.md#create) then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

</TabItem>
<TabItem value="Update">

```tsx title="article.tsx"
import { useController } from 'rest-hooks';
import { ArticleResource } from 'api/article';

export default function UpdateArticleForm({ id }: { id: number }) {
  const article = useSuspense(ArticleResource.get, { id });
  const controller = useController();
  return (
    <Form
      onSubmit={e =>
        controller.fetch(ArticleResource.update, { id }, new FormData(e.target))
      }
      initialValues={article}
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[update](api/createResource.md#update) then takes any `keyable` body to send as the payload and then returns a promise that
then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

</TabItem>
<TabItem value="Delete">

```tsx title="article.tsx"
import { useController } from 'rest-hooks';
import { Article, ArticleResource } from 'api/article';

export default function ArticleWithDelete({ article }: { article: Article }) {
  const controller = useController();
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
      <button
        onClick={() =>
          controller.fetch(ArticleResource.delete, { id: article.id })
        }
      >
        Delete
      </button>
    </article>
  );
}
```

</TabItem>
</Tabs>

We use [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) in
the example since it doesn't require any opinionated form state management solution.
Feel free to use whichever one you prefer.

Mutations automatically update the normalized cache, resulting in consistent and fresh data.
