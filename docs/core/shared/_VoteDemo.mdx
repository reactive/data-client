import { postFixtures } from '@site/src/fixtures/posts';
import HooksPlayground from '@site/src/components/HooksPlayground';

<HooksPlayground fixtures={postFixtures} getInitialInterceptorData={() => ({votes: {}})} row defaultTab={props.defaultTab}>

```ts title="Post" collapsed
import { Entity, schema } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  author = { id: 0 };
  title = '';
  body = '';
  votes = 0;

  static key = 'Post';

  static schema = {
    author: EntityMixin(
      class User {
        id = 0;
      },
    ),
  };

  get img() {
    return `//loremflickr.com/96/72/kitten,cat?lock=${this.id % 16}`;
  }
}
```

```ts title="PostResource" {15-22}
import { resource } from '@data-client/rest';
import { Post } from './Post';

export { Post };

export const PostResource = resource({
  path: '/posts/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Post,
}).extend('vote', {
  path: '/posts/:id/vote',
  method: 'POST',
  body: undefined,
  schema: Post,
  getOptimisticResponse(snapshot, { id }) {
    const post = snapshot.get(Post, { id });
    if (!post) throw snapshot.abort;
    return {
      id,
      votes: post.votes + 1,
    };
  },
});
```

```tsx title="PostItem" {7} collapsed
import { useController } from '@data-client/react';
import { PostResource, type Post } from './PostResource';

export default function PostItem({ post }: Props) {
  const ctrl = useController();
  const handleVote = () => {
    ctrl.fetch(PostResource.vote, { id: post.id });
  };
  return (
    <div>
      <div className="voteBlock">
        <small className="vote">
          <button className="up" onClick={handleVote}>
            &nbsp;
          </button>
          {post.votes}
        </small>
        <img src={post.img} width="70" height="52" />
      </div>
      <div>
        <h4>{post.title}</h4>
        <p>{post.body}</p>
      </div>
    </div>
  );
}
interface Props {
  post: Post;
}
```

```tsx title="TotalVotes" collapsed {11}
import { Query } from '@data-client/rest';
import { useQuery } from '@data-client/react';
import { PostResource } from './PostResource';

const queryTotalVotes = new Query(
  PostResource.getList.schema,
  posts => posts.reduce((total, post) => total + post.votes, 0),
);

export default function TotalVotes({ userId }: Props) {
  const totalVotes = useQuery(queryTotalVotes, { userId });
  return (
    <center>
      <small>{totalVotes} votes total</small>
    </center>
  );
}
interface Props {
  userId: number;
}
```

```tsx title="PostList" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './PostResource';
import PostItem from './PostItem';
import TotalVotes from './TotalVotes';

function PostList() {
  const userId = 2;
  const posts = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <TotalVotes userId={userId} />
    </div>
  );
}
render(<PostList />);
```

</HooksPlayground>
