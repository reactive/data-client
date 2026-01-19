import { postPaginatedFixtures } from '@site/src/fixtures/posts';
import HooksPlayground from '@site/src/components/HooksPlayground';

<HooksPlayground defaultOpen="n" row fixtures={postPaginatedFixtures} defaultTab={props.defaultTab}>

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
    return this.id;
  }
  static key = 'User';
}
```

```ts title="Post" {22,24} collapsed
import { Entity, resource, Collection } from '@data-client/rest';
import { User } from './User';

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  pk() {
    return this.id;
  }
  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'cursor',
}).extend('getList', {
  schema: { posts: new Collection([Post]), cursor: '' },
});
```

```tsx title="PostItem" collapsed
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

```tsx title="LoadMore" {7}
import { useController, useLoading } from '@data-client/react';
import { PostResource } from './Post';

export default function LoadMore({ cursor }: { cursor: string }) {
  const ctrl = useController();
  const [loadPage, isPending] = useLoading(
    () => ctrl.fetch(PostResource.getList.getPage, { cursor }),
    [cursor],
  );
  return (
    <center>
      <button onClick={loadPage} disabled={isPending}>
        {isPending ? '...' : 'Load more'}
      </button>
    </center>
  );
}
```

```tsx title="PostList" {7} collapsed
import { useSuspense } from '@data-client/react';
import PostItem from './PostItem';
import LoadMore from './LoadMore';
import { PostResource } from './Post';

export default function PostList() {
  const { posts, cursor } = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      {cursor ? <LoadMore cursor={cursor} /> : null}
    </div>
  );
}
render(<PostList />);
```

</HooksPlayground>
