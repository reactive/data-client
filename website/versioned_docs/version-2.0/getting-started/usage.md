---
id: version-2.0-usage
title: Usage
original_id: usage
---

## Define a [Resource](../api/Resource.md)

#### `resources/article.ts`

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->

```typescript
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
}
```

<!--Javascript-->

```js
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  id = null;
  title = '';
  content = '';
  author = null;
  tags = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
}
```

<!--FlowType-->

```jsx
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  +id: ?number = null;
  +title: string = '';
  +content: string = '';
  +author: ?number = null;
  +tags: string[] = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

Be sure to add all the properties you expect and mark them as readonly. [Mutation is considered harmful.](../guides/immutability.md)

Also be sure to provide the `pk()` function and `static urlRoot` string.

APIs quickly get much more complicated! [Customizing Resources to fit your API](../guides/resource-types)

## [Use resource](../api/useResource.md)

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

This will automatically fetch the resource if it is not already available. Param changes also results
in a fetch. Consistency of data is guaranteed even when other components fetch updates and even when
those updates are of a different form.

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
    <Form onSubmit={e => create(new FormData(e.target), {})}>
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
      onSubmit={e => update(new FormData(e.target), { id })}
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
      <button onClick={() => del(undefined, { id: article.id })}>Delete</button>
    </article>
  );
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

We use [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) in
the example since it doesn't require any opinionated form state management solution.
Feel free to use whichever one you prefer.
