# Resources with nested structure

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Resource][1] defintion.
These should be the primary keys of the entities we care about.

Next we'll need to extend the schema definition provided by `getEntitySchema()`.

`ArticleResource.ts`

```tsx
import { Resource } from 'rest-hooks';
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

  // operative method!
  static getEntitySchema<T extends typeof Resource>(this: T) {
    const schema = super.getEntitySchema();
    schema.define({
      author: UserResource.getEntitySchema(),
      contributors: [UserResource.getEntitySchema()]
    })
    return schema;
  }
}
```

Upon fetching the nested items will end up in the cache so they can be retrieved with [useCache()][2]

`ArticleList.tsx`

```tsx
export default function ArticleList({ id }: { id: number }) {
  const articles = useResource(ArticleResource.listRequest(), { id })

  return (
    <React.Fragment>
      {articles.map(article => <ArticleInline key={article.pk()} article={article} />)}
    </React.Fragment>
  )
}

function ArticleInline({ article }: { article: ArticleResource }) {
  const author = useCache(UserResource.singleRequest(), { id: article.author });
  // some jsx here
}
```

[1]: ../api/Resource.md
[2]: ../api/useCache.md
