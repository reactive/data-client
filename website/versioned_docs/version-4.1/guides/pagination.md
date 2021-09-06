---
title: Pagination
id: pagination
original_id: pagination
---

## Tokens in Body

A common way APIs deal with pagination is the list view will return an object with both pagination information
and the Array of results as another member.

`GET http://test.com/article/?page=abcd`

```json
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

To deal with our specific shape, we'll need to customize the [FetchShape](../api/FetchShape.md) of lists to
understand how to normalize the results (via schema). Be sure to provide defaults in your schema for any members
that aren't entities.

`resources/ArticleResource.ts`

```typescript
import {
  Resource,
  SchemaList,
  ReadShape,
  AbstractInstanceType,
} from 'rest-hooks';
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

  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { results: [this.asSchema()], nextPage: '', prevPage: '' },
    };
  }
}
```

Now we can use `listShape()` to get not only the articles, but also our `nextPage`
and `prevPage` values. We can use those tokens to define our pagination buttons.

`ArticleList.tsx`

```tsx
import { useResource } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList() {
  const { results: articles, nextPage, prevPage } = useResource(
    ArticleResource.listShape(),
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
case you'll need to customize the [fetch()](../api/FetchShape#fetchurl-string-body-payload-promise-any) function
for [listShape()](../api/resource#listshape-readshape) so the pagination headers are included fetch object.

We show the custom listShape() below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

<!--DOCUSAURUS_CODE_TABS-->
<!--fetch (default)-->

```typescript
import { Resource } from 'rest-hooks';

export default class ArticleResource extends Resource {
  // same as above....

  /** Shape to get a list of entities */
  static listShape<T extends typeof Resource>(this: T) {
    const fetch = async (params: Readonly<Record<string, string | number>>) => {
      const response = await this.fetchResponse('get', this.listUrl(params));
      return {
        link: response.headers.get('link'),
        results: await response.json().catch((error: any) => {
          error.status = 400;
          throw error;
        }),
      };
    };
    return {
      ...super.listShape(),
      fetch,
      schema: { results: [this.asSchema()], link: '' },
    };
  }
}
```

<!--superagent-->

```typescript
import request from 'superagent';
import {
  Resource,
  ReadShape,
  SchemaList,
  AbstractInstanceType,
} from 'rest-hooks';

export default class ArticleResource extends Resource {
  // same as above....

  /** Shape to get a list of entities */
  static listShape<T extends typeof Resource>(this: T) {
    const fetch = async (
      params: Readonly<object>,
      body?: Readonly<object | string>,
    ) => {
      const url = this.listUrl(params);
      let req = request['get'](url).on('error', () => {});
      if (this.fetchPlugin) req = req.use(this.fetchPlugin);
      if (body) req = req.send(body);
      const res = await req;
      let jsonResponse = res.body;
      // include both the body and the link header
      jsonResponse = {
        link: res.headers.link,
        results: jsonResponse,
      };
      return jsonResponse;
    };

    return {
      ...super.listShape(),
      fetch,
      schema: { results: [this.asSchema()], link: '' },
    };
  }
}
```

<!--END_DOCUSAURUS_CODE_TABS-->

## Code organization

If much of your `Resources` share a similar pagination, you might
try extending from a base class that defines such common customizations.
