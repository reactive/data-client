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

const posts = [
  {
    id: 1,
    title: 'Moving to a new city',
    body: 'Three weeks in, the boxes are mostly gone. What I packed first turned out to matter least, and the one thing I left behind, a beat-up desk lamp, is the thing I miss every evening. Here is what I would pack differently next time.',
    author: 'Maya Chen',
    avatar: 'https://i.pravatar.cc/64?img=47',
  },
  {
    id: 2,
    title: 'Weekend bread baking',
    body: 'A slow overnight rise in the fridge makes all the difference. The dough gets easier to shape, the crust browns better, and the whole loaf tastes like you tried much harder than you did.',
    author: 'Sam Rivera',
    avatar: 'https://i.pravatar.cc/64?img=12',
  },
  {
    id: 3,
    title: 'A week without notifications',
    body: 'I turned off every notification on my phone for seven days. The first two were strange. By the end, I was checking messages on my own schedule and getting a lot more done.',
    author: 'Priya Patel',
    avatar: 'https://i.pravatar.cc/64?img=32',
  },
];

/** The post arrives quickly and its comments slowly, so where the
 * AsyncBoundary sits decides what shows while they load */
export const boundaryFixtures = [
  {
    endpoint: PostResource.getList,
    args: [],
    response: posts,
  },
  {
    endpoint: PostResource.get,
    response: ({ id }: { id: string }) =>
      posts.find(post => post.id === Number(id)),
    delay: 500,
  },
  {
    endpoint: CommentResource.getList,
    // every post shares these comments
    response: () => [
      {
        id: 1,
        postId: 1,
        author: 'Alex Kim',
        avatar: 'https://i.pravatar.cc/64?img=8',
        text: 'Loved this, thanks for writing it up.',
      },
      {
        id: 2,
        postId: 1,
        author: 'Jordan Lee',
        avatar: 'https://i.pravatar.cc/64?img=26',
        text: 'Saving this for later.',
      },
    ],
    delay: 2000,
  },
];
