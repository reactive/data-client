---
id: usage
title: Usage
original_id: usage
---

## Define a Resource

#### `resources/article.ts`

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->

```typescript
import { Resource } from 'rest-hooks';

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

<!--Javascript-->

```js
import { Resource } from 'rest-hooks';

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

<!--FlowType-->

```jsx
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  +id: ?number = undefined;
  +title: string = '';
  +content: string = '';
  +author: ?number = null;
  +tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/article/';
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

[Resource](../api/Resource)s are immutable. Use `readonly` in typescript to enforce this.

Default values ensure simpler types, which means less conditionals in your components.

`pk()` is essential to tell Rest Hooks how to normalize the data. This ensures consistency
and the best performance characteristics possible.

`static urlRoot` is used as the basis of common [url patterns](../guides/url)

APIs quickly get much more complicated! [Customizing Resources to fit your API](../guides/resource-types)

## Use the Resource

<!--DOCUSAURUS_CODE_TABS-->
<!--Single-->

```tsx
import { useResource } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function ArticleDetail({ id }: { id: number }) {
  const article = useResource(ArticleResource.detailShape(), { id });
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
    </article>
  );
}
```

<!--List-->

```tsx
import { useResource } from 'rest-hooks';
import ArticleResource from 'resources/article';
import ArticleSummary from './ArticleSummary';

export default function ArticleList({ sortBy }: { sortBy: string }) {
  const articles = useResource(ArticleResource.listShape(), { sortBy });
  return (
    <section>
      {articles.map(article => (
        <ArticleSummary key={article.pk()} article={article} />
      ))}
    </section>
  );
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

[useResource()](../api/useResource.md) guarantees access to data with sufficient [freshness](../api/FetchShape#dataexpirylength-number).
This means it may issue network calls, and it may [suspend](../guides/loading-state.md) until the the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [shapes](../api/FetchShape).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

## [Dispatch mutation](../api/useFetcher.md)

#### `article.tsx`

<!--DOCUSAURUS_CODE_TABS-->
<!--Create-->

```tsx
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function NewArticleForm() {
  const create = useFetcher(ArticleResource.createShape());
  // create as (body: Readonly<Partial<ArticleResource>>, params?: Readonly<object>) => Promise<any>
  return (
    <Form onSubmit={e => create({}, new FormData(e.target))}>
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

`create()` then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

<!--Update-->

```tsx
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function UpdateArticleForm({ id }: { id: number }) {
  const article = useResource(ArticleResource.detailShape(), { id });
  const update = useFetcher(ArticleResource.updateShape());
  // update as (body: Readonly<Partial<ArticleResource>>, params?: Readonly<object>) => Promise<any>
  return (
    <Form
      onSubmit={e => update({ id }, new FormData(e.target))}
      initialValues={article}
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

`update()` then takes any `keyable` body to send as the payload and then returns a promise that
resolves to the new Resource created by the API. It will automatically be added in the cache for any consumers to display.

<!--Delete-->

```tsx
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function ArticleWithDelete({ article }: { article: ArticleResource }) {
  const del = useFetcher(ArticleResource.deleteShape());
  // del as (body: any, params?: Readonly<object>) => Promise<any>
  return (
    <article>
      <h2>{article.title}</h2>
      <div>{article.content}</div>
      <button onClick={() => del({ id: article.id })}>Delete</button>
    </article>
  );
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

We use [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) in
the example since it doesn't require any opinionated form state management solution.
Feel free to use whichever one you prefer.

Mutations automatically update the normalized cache, resulting in consistent and fresh data.
