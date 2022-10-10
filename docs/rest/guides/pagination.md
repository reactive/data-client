---
title: Pagination
---

<head>
  <title>Paginating REST data</title>
</head>

## Infinite Scrolling

In case you want to append results to your existing list, rather than move to another page
[RestEndpoint.paginated()](api/RestEndpoint.md#paginated) can be used.

```typescript title="api/News.ts"
import { Entity, createResource } from '@rest-hooks/rest';

export class News extends Entity {
  readonly id: string | undefined = undefined;
  readonly title = '';
  readonly url = '';
  readonly previewImage = '';

  pk() {
    return this.id;
  }
}
const BaseNewsResource = createResource({
  path: '/news/:id',
  schema: News,
});
// custom schema
const getList = BaseNewsResource.getList.extend({
  schema: { results: [News], cursor: '' },
});
// this creates a pagination endpoint that will extend the getList endpoint
const getNextPage = getList.paginated(
  ({ cursor, ...rest }: { cursor: string | number }) =>
    (Object.keys(rest).length ? [rest] : []) as any,
);
export const NewsResource = {
  ...BaseNewsResource,
  getList,
  getNextPage,
};
```

Since UI behaviors vary widely, and implementations vary from platform (react-native or web),
we'll just assume a `Pagination` component is built, that uses a callback to trigger next
page fetching. On web, it is recommended to use something based on [Intersection Observers](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

```tsx
import { useSuspense, useController } from 'rest-hooks';
import { NewsResource } from 'api/News';

function NewsList() {
  const { results, cursor } = useSuspense(NewsResource.getList);
  const controller = useController();

  return (
    <Pagination
      onPaginate={() => controller.fetch(NewsResource.getNextPage, { cursor })}
    >
      <NewsList data={results} />
    </Pagination>
  );
}
```

## Tokens in Body

A common way APIs deal with pagination is the list view will return an object with both pagination information
and the Array of results as another member.

```json title="GET http://test.com/article/?page=abcd"
{
  "nextPage": null,
  "prevPage": "http://test.com/article/?page=aedcba",
  "results": [
    {
      "id": 5,
      "content": "have a merry christmas",
      "author": 2,
      "contributors": []
    },
    {
      "id": 532,
      "content": "never again",
      "author": 23,
      "contributors": [5]
    }
  ]
}
```

To deal with our specific endpoint, we'll need to customize the [RestEndpoint](api/RestEndpoint.md) of lists to
understand how to normalize the results (via schema). Be sure to provide defaults in your schema for any members
that aren't entities.

```typescript title="api/Article.ts"
import { Entity } from '@rest-hooks/rest';
import { User } from 'api';

export class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
}

const BaseArticleResource = createResource({
  urlPrefix: 'http://test.com',
  path: '/article/:id',
  schema: Article,
});
export const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({
    schema: { results: [Article], nextPage: '', prevPage: '' },
  }),
};
```

Now we can use `getList` to get not only the articles, but also our `nextPage`
and `prevPage` values. We can use those tokens to define our pagination buttons.

```tsx title="ArticleList.tsx"
import { useSuspense } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList() {
  const {
    results: articles,
    nextPage,
    prevPage,
  } = useSuspense(ArticleResource.getList);
  return (
    <>
      <div>
        {articles.map(article => (
          <Article key={article.pk()} article={article} />
        ))}
      </div>
      {prevPage && <Link to={prevPage}>‹ Prev</Link>}
      {nextPage && <Link to={nextPage}>Next ›</Link>}
    </>
  );
}
```

## Tokens in HTTP Headers

In some cases the pagination tokens will be embeded in HTTP headers, rather than part of the payload. In this
case you'll need to customize the [parseResponse()](api/RestEndpoint.md#parseResponse) function
for [getList](api/createResource.md#getlist) so the pagination headers are included fetch object.

We show the custom `getList` below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

```typescript
import { Resource } from '@rest-hooks/rest';

export const ArticleResource = {
  ...BaseArticleResource,
  getList: BaseArticleResource.getList.extend({
    schema: { results: [Article], link: '' },
    async parseResponse(response: Response) {
      const results = await BaseArticleResource.getList.parseResponse(response);
      if (
        (response.headers && response.headers.has('link')) ||
        Array.isArray(results)
      ) {
        return {
          link: response.headers.get('link'),
          results,
        };
      }
      return results;
    },
  }),
};
```

## Code organization

If much of your API share a similar pagination, you might
try a custom Endpoint class that shares this logic.

```ts title="api/PagingEndpoint.ts"
import { RestEndpoint, type RestGenerics } from '@rest-hooks/rest';

export class PagingEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }
}
```

```ts title="api/My.ts"
import { createResource, Entity } from '@rest-hooks/rest';

import { PagingEndpoint } from './PagingEndpoint';

export const MyResource = createResource({
  path: '/stuff/:id',
  schema: MyEntity,
  Endpoint: PagingEndpoint,
});
```
