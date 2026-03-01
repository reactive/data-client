import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';

  static key = 'Post';
}

export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});

export class Comment extends Entity {
  id = 0;
  postId = 0;
  author = '';
  text = '';

  static key = 'Comment';
}

export const CommentResource = resource({
  path: '/comments/:id',
  searchParams: {} as { postId: number },
  schema: Comment,
});

const delay = 600;

export const parallelFetchFixtures = [
  {
    endpoint: PostResource.get,
    args: [{ id: 1 }],
    response: {
      id: 1,
      title: 'Parallel Data Loading in React',
      body: 'With useFetch() and React.use(), multiple fetches start at the same time — no sequential waterfalls.',
    },
    delay,
  },
  {
    endpoint: CommentResource.getList,
    args: [{ postId: 1 }],
    response: [
      {
        id: 1,
        postId: 1,
        author: 'Alice',
        text: 'This pattern is so much faster!',
      },
      {
        id: 2,
        postId: 1,
        author: 'Bob',
        text: 'No more request waterfalls 🎉',
      },
      {
        id: 3,
        postId: 1,
        author: 'Carol',
        text: 'Works great with Suspense boundaries.',
      },
    ],
    delay,
  },
];
