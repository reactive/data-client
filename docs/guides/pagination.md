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
understand how to normalize the results (via schema), as well as denormalizing from
the `rest-hooks` cache (via a selector).

`resources/ArticleResource.ts`

```typescript
import { Resource, selectors } from 'rest-hooks';
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

  static listRequest<T extends typeof Resource>(this: T) {
    return {
      ...super.listRequest(),
      schema: { results: [super.getSchema()] },
      select: selectors.makeList(this, results => results.results),
    };
  }
}
```

Now we can use `listRequest()` as normal.

Additionally, we can add pagination buttons using [useResultSelect](../api/useResultSelect).

`ArticleList.tsx`

```tsx
import { hooks } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList() {
  const articles = hooks.useResource(ArticleResource.listRequest(), {});
  const { nextPage, prevPage } = hooks.useResultSelect(
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
