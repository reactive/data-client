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

[RestEndpoint](/rest/api/RestEndpoint) are the _methods_ of your data. [Schemas](api/schema.md) define the data model. [Resources](./api/createResource.md) are
a collection of `endpoints` around one `schema`.

<LanguageTabs>

```typescript title="api/Article.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class Article extends Entity {
  id: number | undefined = undefined;
  title = '';
  content = '';
  author = User.fromJS({});
  tags: string[] = [];
  createdAt = new Date(0);

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: User,
    createdAt: Date,
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
  author = User.fromJS({});
  tags = [];
  createdAt = new Date(0);

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: User,
    createdAt: Date,
  }
}
export const ArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
```

</LanguageTabs>

[Entity](./api/Entity.md) is a kind of schema that [has a primary key (pk)](/docs/concepts/normalization). This is what allows us
to [avoid state duplication](https://beta.reactjs.org/learn/choosing-the-state-structure#principles-for-structuring-state), which
is one of the core design choices that enable such high safety and performance characteristics.

[static schema](./api/Entity.md#schema) lets us specify declarative transformations like auto [field deserialization](./guides/network-transform.md#deserializing-fields) with `createdAt` and [nesting the author field](./guides/nested-response.md).

[Urls are constructed](./api/RestEndpoint.md#url) by combining the urlPrefix with [path templating](https://www.npmjs.com/package/path-to-regexp).
TypeScript enforces the arguments specified with a prefixed colon like `:id` in this example.

```ts
// GET http://test.com/article/5
TodoResource.get({ id: 5 })
```

## Bind the data with Suspense

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useSuspense } from '@rest-hooks/react';
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
import { useSuspense } from '@rest-hooks/react';
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

[useSuspense()](/docs/api/useSuspense) acts like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), ensuring the data is available before returning. [Learn how to be declare your data dependencies](/docs/getting-started/data-dependency)

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
import { useController } from '@rest-hooks/react';
import { ArticleResource } from 'api/article';

export default function NewArticleForm() {
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(ArticleResource.create, new FormData(e.target))
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
import { useController } from '@rest-hooks/react';
import { ArticleResource } from 'api/article';

export default function UpdateArticleForm({ id }: { id: number }) {
  const article = useSuspense(ArticleResource.get, { id });
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(ArticleResource.update, { id }, new FormData(e.target))
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
import { useController } from '@rest-hooks/react';
import { Article, ArticleResource } from 'api/article';

export default function ArticleWithDelete({ article }: { article: Article }) {
  const ctrl = useController();
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
      <button
        onClick={() =>
          ctrl.fetch(ArticleResource.delete, { id: article.id })
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

[Mutations](/docs/getting-started/mutations) automatically updates *all* usages without the need for
additional requests.
