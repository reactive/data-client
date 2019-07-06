---
title: Resources with nested structure
sidebar_label: Nesting related resources (server-side join)
id: version-1.6.9-nested-response
original_id: nested-response
---

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Resource][1] defintion.
These should be the primary keys of the entities we care about.

Next we'll need to extend the schema definition provided by [getEntitySchema()][3].

## getEntitySchema

#### `resources/ArticleResource.ts`

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
      contributors: [UserResource.getEntitySchema()],
    });
    return schema;
  }
}
```

Upon fetching the nested items will end up in the cache so they can be retrieved with [useCache()][2]

#### `ArticleList.tsx`

```tsx
import { useResource } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList({ id }: { id: number }) {
  const articles = useResource(ArticleResource.listRequest(), { id });

  return (
    <React.Fragment>
      {articles.map(article => (
        <ArticleInline key={article.pk()} article={article} />
      ))}
    </React.Fragment>
  );
}

function ArticleInline({ article }: { article: ArticleResource }) {
  const author = useCache(UserResource.singleRequest(), { id: article.author });
  // some jsx here
}
```

## Circular dependencies

If two or more [Resources][1] include each other in their schema, you can dynamically override
one of their [getEntitySchema()][3] to avoid circular imports.

#### `resources/ArticleResource.ts`

```typescript
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
      contributors: [UserResource.getEntitySchema()],
    });
    return schema;
  }
}

UserResource.getEntitySchema = function <T extends typeof Resource>(this: T) {
  // can't use 'super' here :(
  const schema = Resource.getEntitySchema();
  schema.define({
    posts: [ArticleResource.getEntitySchema()],
  });
  return schema;
}
```

#### `resources/UserResource.ts`

```typescript
import { Resource } from 'rest-hooks';
// no need to import ArticleResource as the getEntitySchema() override happens there.

export default class UserResource extends Resource {
  readonly id: number | null = null;
  readonly name: string = '';
  readonly posts: number[] = [];

  pk() {
    return this.id;
  }
  static urlRoot = 'http://test.com/user/';

}
```

[1]: ../api/Resource.md
[2]: ../api/useCache.md
[3]: ../api/Resource.md#static-getentityschema-schemaentity-https-githubcom-paularmstrong-normalizr-blob-master-docs-apimd-entitykey-definition-options
