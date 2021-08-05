---
title: Resources with nested structure
sidebar_label: Nesting related resources (server-side join)
---

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Resource][1] definition.
These should be the primary keys of the entities we care about.

Next we'll provide a definition of nested members in the [schema][3] member.

## static schema

#### `resources/ArticleResource.ts`

```tsx
import { Resource, AbstractInstanceType } from '@rest-hooks/rest';
import { UserResource } from 'resources';

export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: UserResource = UserResource.fromJS({});
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'http://test.com/article/';

  static schema = {
    author: UserResource,
    contributors: [UserResource],
  };
}
```

#### `ArticleList.tsx`

```tsx
import { useResource } from 'rest-hooks';
import ArticleResource from 'resources/ArticleResource';

export default function ArticleList({ id }: { id: number }) {
  const articles = useResource(ArticleResource.list(), { id });

  return (
    <React.Fragment>
      {articles.map(article => (
        <>
          <ArticleInline key={article.pk()} article={article} />
          <UserPreview user={article.user} />
        </>
      ))}
    </React.Fragment>
  );
}

function UserPreview({ user }: { user: UserResource }) {
  return <span>{user.username} {user.email}</span>
}
```

## Circular dependencies

If both [Resources][1] are in distinct files, this must be handled with care.

If two or more [Resources][1] include each other in their schema, you can dynamically override
one of their [schema][3] to avoid circular imports.

#### `resources/ArticleResource.ts`

```typescript
import { Resource, AbstractInstanceType } from '@rest-hooks/rest';
import { UserResource } from 'resources';

export default class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: UserResource = UserResource.fromJS({});
  readonly contributors: number[] = [];

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'http://test.com/article/';

  static schema = {
    author: UserResource,
    contributors: [UserResource],
  };
}

// we set the schema here since we can correctly reference ArticleResource
UserResource.schema = {
  posts: [ArticleResource],
};
```

#### `resources/UserResource.ts`

```typescript
import { Resource } from '@rest-hooks/rest';
import type { ArticleResource } from 'resources';
// we can only import the type else we break javascript imports
// thus we change the schema of UserResource above

export default class UserResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly name: string = '';
  readonly posts: ArticleResource[] = [];

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'http://test.com/user/';
}
```

[1]: ../api/Resource.md
[2]: ../api/useCache.md
[3]: ../api/Entity#static-schema--k-keyof-this-schema-
