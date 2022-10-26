---
title: Entities with nested structure
sidebar_label: Nesting related data
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@rest-hooks/rest';

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Entity][1] definition.
These should be the primary keys of the entities we care about.

Next we'll provide a definition of nested members in the [schema][3] member.

## static schema

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({ urlPrefix: 'http://fakeapi.com',
path: '/article/:id',}),
args: [{ id: '5' }],
response: {
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
contributors: [{ id: '100', name: 'Eliza' }],
},
delay: 150,
},
]}>

```tsx title="api/Post.ts"
export class User extends Entity {
  id = '';
  name = '';
  pk() {
    return this.id;
  }
}
export class Post extends Entity {
  readonly id: number | undefined = undefined;
  readonly author: User = User.fromJS({});
  readonly content: string = '';
  readonly contributors: User[] = [];

  static schema = {
    author: User,
    contributors: [User],
  };
  pk() {
    return `${this.id}`;
  }
}
export const getPost = new RestEndpoint({
  urlPrefix: 'http://fakeapi.com',
  path: '/article/:id',
  schema: Post,
});
```

```tsx title="PostPage.tsx" collapsed
import { getPost } from './api/Post';

function PostPage() {
  const post = useSuspense(getPost, { id: '5' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <div>Contributors: {post.contributors.map(user => user.name)}</div>
    </div>
  );
}
render(<PostPage />);
```

</HooksPlayground>

## Circular dependencies

If both [Entities][1] are in distinct files, this must be handled with care.

If two or more [Entities][1] include each other in their schema, you can dynamically override
one of their [schema][3] to avoid circular imports.

```typescript title="api/Article.ts"
import { Entity } from '@rest-hooks/rest';
import { User } from './User';

export class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly content: string = '';
  readonly author: User = User.fromJS({});
  readonly contributors: User[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema: { [k: string]: Schema } = {
    author: User,
    contributors: [User],
  };
}

// we set the schema here since we can correctly reference Article
// highlight-start
User.schema = {
  posts: [Article],
};
// highlight-end
```

```typescript title="api/User.ts"
import { Entity } from '@rest-hooks/rest';
import type { Article } from './Article';
// we can only import the type else we break javascript imports
// thus we change the schema of UserResource above

export class User extends Entity {
  readonly id: number | undefined = undefined;
  readonly name: string = '';
  readonly posts: Article[] = [];
  readonly createdAt: Date = new Date(0);

  pk() {
    return this.id?.toString();
  }

  static schema: Record<string, Schema | Date> = {
    createdAt: Date,
  };
}
```

[1]: api/Entity.md
[2]: /docs/api/useCache
[3]: api/Entity.md#schema
