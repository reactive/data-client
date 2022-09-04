---
title: Pagination
---

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

To deal with our specific endpoint, we'll need to customize the [Endpoint](api/Endpoint.md) of lists to
understand how to normalize the results (via schema). Be sure to provide defaults in your schema for any members
that aren't entities.

```typescript title="resources/ArticleResource.ts"
import { Resource, SchemaList, AbstractInstanceType } from '@rest-hooks/rest';
import { UserResource } from 'resources';

export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'http://test.com/article/';

  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { results: [this], nextPage: '', prevPage: '' },
    });
  }
}
```

Now we can use `list()` to get not only the articles, but also our `nextPage`
and `prevPage` values. We can use those tokens to define our pagination buttons.

```tsx title="ArticleList.tsx"
import { useSuspense } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList() {
  const { results: articles, nextPage, prevPage } = useSuspense(
    ArticleResource.list(),
    {},
  );
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
case you'll need to customize the [fetch()](api/Endpoint.md#extend) function
for [list()](api/Resource.md#list) so the pagination headers are included fetch object.

We show the custom list() below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

```typescript
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  // same as above....

  /** Endpoint to get a list of entities */
  static list<T extends typeof Resource>(this: T) {
    const instanceFetchResponse = this.fetchResponse.bind(this);

    return super.list().extend({
      fetch: async function (params: Readonly<Record<string, string | number>>) {
        const response = await instanceFetchResponse(this.url(params), this.init);
        return {
          link: response.headers.get('link'),
          results: await response.json().catch((error: any) => {
            error.status = 400;
            throw error;
        };
      },
      schema: { results: [this], link: '' },
    });
  }
}
```

## Code organization

If much of your `Resources` share a similar pagination, you might
try extending from a base class that defines such common customizations.


## Infinite Scrolling

Sometimes pagination results are presented as an infinite scrolling list.
[Infinite scrolling pagination](/docs/guides/infinite-scrolling-pagination) guide explains more about this.
