---
title: Resources with nested structure
sidebar_label: Nesting related resources (server-side join)
---

import HooksPlayground from '@site/src/components/HooksPlayground';

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Resource][1] definition.
These should be the primary keys of the entities we care about.

Next we'll provide a definition of nested members in the [schema][3] member.

## static schema

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
class UserResource extends Resource {
  readonly name: string = '';
  pk() {
    return this.id;
  }
  static urlRoot = 'http://fakeapi.com/user/';
}
class PostResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly author: UserResource = UserResource.fromJS({});
  readonly contributors: number[] = [];

  static schema = {
    author: UserResource,
    contributors: [UserResource],
  };
  pk() {
    return this.id;
  }
  static urlRoot = 'http://fakeapi.com/article/';

  // this override is purely to fake a response
  static detail<T extends typeof Resource>(this: T) {
    return super.detail().extend({
      fetch({ id }) {
        return Promise.resolve({
          id,
          author: { id: '123', name: 'Jim' },
          content: 'Happy day',
          contributors: [{ id: '100', name: 'Eliza' }],
        });
      },
      schema: this,
    });
  }
}

function PostPage() {
  const post = useSuspense(PostResource.detail(), { id: '5' });
  return (
    <div>
      <p>{post.content} - <cite>{post.author.name}</cite></p>
      <div>Contributors: {post.contributors.map(user => user.name)}</div>
    </div>
  );
}
render(<PostPage />);
```

</HooksPlayground>

## Circular dependencies

If both [Resources][1] are in distinct files, this must be handled with care.

If two or more [Resources][1] include each other in their schema, you can dynamically override
one of their [schema][3] to avoid circular imports.

```typescript title="resources/ArticleResource.ts"
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

  static schema: { [k: string]: Schema } = {
    author: UserResource,
    contributors: [UserResource],
  };
}

// we set the schema here since we can correctly reference ArticleResource
UserResource.schema = {
  posts: [ArticleResource],
};
```

```typescript title="resources/UserResource.ts"
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

[1]: api/Resource.md
[2]: /docs/api/useCache
[3]: api/Entity.md#schema
