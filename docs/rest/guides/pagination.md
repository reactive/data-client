---
title: Pagination
---

import StackBlitz from '@site/src/components/StackBlitz';
import { postPaginatedFixtures } from '@site/src/fixtures/posts';
import HooksPlayground from '@site/src/components/HooksPlayground';

<head>
  <title>Paginating REST data</title>
</head>

## Expanding Lists

In case you want to append results to your existing list, rather than move to another page
[RestEndpoint.getPage](../api/RestEndpoint.md#getpage) can be used as long as [paginationField](../api/RestEndpoint.md#paginationfield) was provided.

<HooksPlayground defaultOpen="n" row fixtures={postPaginatedFixtures}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  pk() {
    return `${this.id}`;
  }
  static key = 'User';
}
```

```ts title="Post" {22,24} collapsed
import { Entity, createResource } from '@data-client/rest';
import { User } from './User';

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  pk() {
    return this.id?.toString();
  }
  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'cursor',
}).extend('getList', {
  schema: { results: new schema.Collection([Post]), cursor: '' },
});
```

```tsx title="PostItem" collapsed
import { useSuspense } from '@data-client/react';
import { type Post } from './Post';

export default function PostItem({ post }: Props) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>{post.title}</h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}

interface Props {
  post: Post;
}
```

```tsx title="PostList" {9}
import { useSuspense } from '@data-client/react';
import PostItem from './PostItem';
import { PostResource } from './Post';

export default function PostList() {
  const { results, cursor } = useSuspense(PostResource.getList);
  const ctrl = useController();
  const handlePageLoad = () =>
    ctrl.fetch(PostResource.getList.getPage, { cursor });
  return (
    <div>
      {results.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      {cursor ? (
        <center>
          <button onClick={handlePageLoad}>Load more</button>
        </center>
      ) : null}
    </div>
  );
}
render(<PostList />);
```

</HooksPlayground>

Don't forget to define our [Resource's](../api/createResource.md) [paginationField](../api/createResource.md#paginationfield) and
correct [schema](../api/createResource.md#schema)! 

```ts title="Post"
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
  // highlight-next-line
  paginationField: 'cursor',
}).extend('getList', {
  // highlight-next-line
  schema: { results: new schema.Collection([Post]), cursor: '' },
});
```

### Demo

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/NextPage.tsx" />

Explore more [Reactive Data Client demos](/demos)

### Infinite Scrolling

Since UI behaviors vary widely, and implementations vary from platform (react-native or web),
we'll just assume a `Pagination` component is built, that uses a callback to trigger next
page fetching. On web, it is recommended to use something based on [Intersection Observers](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

```tsx
import { useSuspense, useController } from '@data-client/react';
import { PostResource } from 'resources/Post';

function NewsList() {
  const { results, cursor } = useSuspense(PostResource.getList);
  const ctrl = useController();

  return (
    <Pagination onPaginate={() => ctrl.fetch(PostResource.getList.getPage, { cursor })}>
      <NewsList data={results} />
    </Pagination>
  );
}
```

## Tokens in HTTP Headers

In some cases the pagination tokens will be embeded in HTTP headers, rather than part of the payload. In this
case you'll need to customize the [parseResponse()](api/RestEndpoint.md#parseResponse) function
for [getList](api/createResource.md#getlist) so the pagination headers are included fetch object.

We show the custom `getList` below. All other parts of the above example remain the same.

Pagination token is stored in the header `link` for this example.

```typescript
import { Resource } from '@data-client/rest';

export const ArticleResource = createResource({
  path: '/articles/:id',
  schema: Article,
}).extend(Base => ({
  getList: Base.getList.extend({
    schema: { results: [Article], link: '' },
    async parseResponse(response: Response) {
      const results = await Base.getList.parseResponse(response);
      if (
        (response.headers && response.headers.has('link')) ||
        Array.isArray(results)
      ) {
        return {
          link: response.headers.get('link'),
          results,
        };
      }
      return results;
    },
  }),
}));
```

### Code organization

If much of your API share a similar pagination, you might
try a custom Endpoint class that shares this logic.

```ts title="api/PagingEndpoint.ts"
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

export class PagingEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }
}
```

```ts title="api/My.ts"
import { createResource, Entity } from '@data-client/rest';

import { PagingEndpoint } from './PagingEndpoint';

export const MyResource = createResource({
  path: '/stuff/:id',
  schema: MyEntity,
  Endpoint: PagingEndpoint,
});
```
