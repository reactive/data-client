---
id: README
title: REST
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

## Define a Resource

<LanguageTabs>

```typescript title="resources/article.ts"
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/article/';
}
```

```js title="resources/article.js"
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  id = undefined;
  title = '';
  content = '';
  author = null;
  tags = [];

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/article/';
}
```

</LanguageTabs>

[Resource](api/Resource.md)s are immutable. Use `readonly` in typescript to enforce this.

Default values ensure simpler types, which means less conditionals in your components.

[pk()](api/Resource.md#pk) is essential to tell Rest Hooks how to normalize the data. This ensures consistency
and the best performance characteristics possible.

[static urlRoot](api/Resource.md#urlRoot) is used as the basis of common [url patterns](./guides/url.md)

APIs quickly get much more complicated! [Customizing Resources to fit your API](./guides/extending-endpoints.md)

## Use the Resource

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useSuspense } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function ArticleDetail({ id }: { id: number }) {
  const article = useSuspense(ArticleResource.detail(), { id });
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
import ArticleResource from 'resources/article';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({ sortBy }: { sortBy: string }) {
  const articles = useSuspense(ArticleResource.list(), { sortBy });
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

[useSuspense()](/docs/api/useSuspense) guarantees access to data with sufficient [freshness](api/Endpoint.md#dataexpirylength).
This means it may issue network calls, and it may [suspend](/docs/getting-started/data-dependency#async-fallbacks) until the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [endpoints](api/Endpoint.md).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

## Dispatch mutation

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
import ArticleResource from 'resources/article';

export default function NewArticleForm() {
  const { fetch } = useController();
  return (
    <Form onSubmit={e => fetch(ArticleResource.create(), new FormData(e.target))}>
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[create()](api/Resource.md#create) then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

</TabItem>
<TabItem value="Update">

```tsx title="article.tsx"
import { useController } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function UpdateArticleForm({ id }: { id: number }) {
  const article = useSuspense(ArticleResource.detail(), { id });
  const { fetch } = useController();
  return (
    <Form
      onSubmit={e => fetch(ArticleResource.update(), { id }, new FormData(e.target))}
      initialValues={article}
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

[update()](api/Resource.md#update) then takes any `keyable` body to send as the payload and then returns a promise that
 then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

</TabItem>
<TabItem value="Delete">

```tsx title="article.tsx"
import { useController } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function ArticleWithDelete({ article }: { article: ArticleResource }) {
  const { fetch } = useController();
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
      <button onClick={() => fetch(ArticleResource.delete(), { id: article.id })}>Delete</button>
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
