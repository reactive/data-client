# Pagination

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

To deal with our specific shape, we'll need to customize the [RequestShape](../api/RequestShape.md) of lists to
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

  static listRequest<T extends typeof Resource>(this: T): ReadShape<Readonly<object>, Readonly<object>, SchemaArray<AbstractInstanceType<T>>> {
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
