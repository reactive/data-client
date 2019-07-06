---
title: Pagination
---

## Tokens in Body

A common way APIs deal with pagination is the list view will return an object with both pagination information
and the Array of results as another member.

`GET http://test.com/article/page=abcd`

```json
{
  "nextPage": null,
  "prevPage": "http://test.com/article/page=aedcba",
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

To deal with our specific shape, we'll need to customize the [FetchShape](../api/FetchShape.md) of lists to
understand how to normalize the results (via schema).

`resources/ArticleResource.ts`

```typescript
import { Resource, SchemaArray, ReadShape, AbstractInstanceType } from 'rest-hooks';
import { UserResource } from 'resources';

export default class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id;
  }
  static urlRoot = 'http://test.com/article/';

  static listRequest<T extends typeof Resource>(this: T): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    return {
      ...super.listRequest(),
      schema: { results: [this.getEntitySchema()] },
    };
  }
}
```

Now we can use `listRequest()` as normal.

Additionally, we can add pagination buttons using [useResultCache](../api/useResultCache).

`ArticleList.tsx`

```tsx
import { useResource, useResultCache } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList() {
  const articles = useResource(ArticleResource.listRequest(), {});
  const { nextPage, prevPage } = useResultCache(
    ArticleResource.listRequest(),
    {},
    { nextPage: '', prevPage: '' }
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
case you'll need to customize the [fetch()](../api/FetchShape#fetchurl-string-body-payload-promise-any) function
for [listRequest()](../api/resource#listrequest-readshape) so the pagination headers are included fetch object.

We show the custom listRequest() below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

```typescript
import request from 'superagent';
import { Resource, ReadShape, SchemaArray, AbstractInstanceType } from 'rest-hooks';

export default class ArticleResource extends Resource {
  // same as above....

  /** Shape to get a list of entities */
  static listRequest<T extends typeof Resource>(this: T): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    const fetch = async (url: string, body?: Readonly<object>) => {
      let req = request['get'](url).on('error', () => {});
      if (this.fetchPlugin) req = req.use(this.fetchPlugin);
      if (body) req = req.send(body);
      const res = (await req);
      let jsonResponse = res.body;
      // include both the body and the link header
      jsonResponse = {
        link: res.headers.link,
        results: jsonResponse,
      }
      return jsonResponse;
    };

    return {
      ...super.listRequest(),
      fetch,
      schema: { results: [this.getEntitySchema()] },
    };
  }
}
```

## Code organization

If much of your `Resources` share a similar pagination, you might
try extending from a base class that defines such common customizations.
