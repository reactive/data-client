import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';
import { v4 as uuid } from 'uuid';

type EntityPost = {
  id: string;
  title: string;
  body: string;
  votes: number;
  author: number;
};

type PostInterceptorState = {
  entities: Record<string | number, Record<string, unknown>>;
  votes?: Record<string | number, number>;
};

type PostListParams = NonNullable<
  Parameters<typeof PostResource.getList>[0]
> & {
  page?: number;
  cursor?: number;
};

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

  static key = 'User';
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';
  votes = 0;

  static key = 'Post';

  static schema = {
    author: User,
  };

  get img() {
    return `https://loremflickr.com/400/200/kitten,cat?lock=${this.id % 16}`;
  }
}

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

const entities: Record<string, EntityPost> = {
  '1': {
    id: '1',
    title: 'Why wait on data we already have?',
    body: 'The fastest fetch is the one that never happens. With Reactive Data Client, components use the same global data. This means no waiting when navigating from a list to detail view. No overfetching when data is reused in multiple component instances.',
    votes: 101,
    author: 1,
  },
  '2': {
    id: '2',
    title: 'Why does user experince matter?',
    body: 'Slow interactions, confusing inconsistent data, UI flickering great a mental burden on your customers. This reduces their productivity and their frustration can make them lose trust.',
    votes: 81,
    author: 2,
  },
  '3': {
    id: '3',
    title: 'What are atomic mutations?',
    body: 'Atomic means indivisible. Atomic mutations reactively update every usage on or off screen at the same time. This eliminates data tearing while improving performance.',
    votes: 73,
    author: 2,
  },
  '4': {
    id: '4',
    title: 'The second page of posts starts here',
    body: 'Next thing',
    votes: 23,
    author: 1,
  },
  // '5': {
  //   id: '5',
  //   title: 'More posts for this page',
  //   body: 'More stuff',
  //   votes: 7,
  //   author: 1,
  // },
  '6': {
    id: '6',
    title: 'This is the last item',
    body: 'Oh my',
    votes: 10,
    author: 3,
  },
};

export const getInitialInterceptorData = (): PostInterceptorState => ({
  entities: {},
});

export const postFixtures: Interceptor<PostInterceptorState>[] = [
  {
    endpoint: PostResource.get,
    async response({ id }: Parameters<typeof PostResource.get>[0]) {
      const entity = entities[String(id)];
      const author = await UserResource.get({ id: entity.author });
      return {
        ...entity,
        id,
        votes: 0,
        author,
      };
    },
  },
  {
    endpoint: PostResource.getList,
    async response(...args: Parameters<typeof PostResource.getList>) {
      const params = args[0] as PostListParams | undefined;
      const page = params?.page ?? 1;
      const userId = params?.userId;
      let posts = Object.values(entities);
      if (userId) {
        posts = Object.values(entities).filter(
          post => post.author === params?.userId,
        );
      }
      const PAGE_SIZE = 3;
      posts = posts.slice((page - 1) * PAGE_SIZE, PAGE_SIZE * page);
      // we are modifying the post later so we need to shallow copy it
      posts = posts.map(post => ({ ...post }));
      // get users to merge
      await Promise.all(
        posts.map(post =>
          post.author ?
            UserResource.get({ id: post.author })
              .then(user => {
                (post as any).author = user;
                return user;
              })
              .catch(e => {
                // fallback in case of failure
                const user = {
                  id: post.author,
                  name: 'Leanne Graham',
                };
                (post as any).author = user;
                return user;
              })
          : Promise.resolve({}),
        ),
      );
      return posts;
    },
  },
  {
    endpoint: PostResource.vote,
    response({ id }: Parameters<typeof PostResource.vote>[0]) {
      const entity = entities[String(id)];
      if (!this.votes) this.votes = {};
      const votes = (this.votes[id] = (this.votes[id] ?? entity.votes) + 1);
      return {
        id,
        votes,
      };
    },
    delay: () => 500 + Math.random() * 4500,
  },
  {
    endpoint: PostResource.update,
    response(
      { id }: Parameters<typeof PostResource.update>[0],
      body: Parameters<typeof PostResource.update>[1],
    ) {
      const entity = entities[String(id)];
      this.entities[id] = {
        ...entity,
        ...(body instanceof FormData ? {} : body),
        id,
        votes: 0,
      };
      if (body instanceof FormData) {
        for (const [key, value] of body.entries()) {
          this.entities[id][key] = value;
        }
      }
      return this.entities[id];
    },
    delay: 500,
  },
  {
    endpoint: PostResource.getList.push,
    response(body: Parameters<typeof PostResource.getList.push>[0]) {
      const id = randomId();
      this.entities[id] = { id, author: 1 };
      const entries =
        body instanceof FormData ? body.entries() : Object.entries(body);
      for (const [key, value] of entries) {
        this.entities[id][key] = value;
      }
      return this.entities[id];
    },
    delay: 500,
  },
];

export const postPaginatedFixtures: Interceptor<PostInterceptorState>[] = [
  {
    endpoint: PostResource.getList,
    async response(...args: Parameters<typeof PostResource.getList>) {
      const params = args[0] as PostListParams | undefined;
      const cursor = params?.cursor ?? 1;
      const userId = params?.userId;
      let posts = Object.values(entities);
      if (userId) {
        posts = Object.values(entities).filter(
          post => post.author === params?.userId,
        );
      }
      const PAGE_SIZE = 3;
      posts = posts.slice((cursor - 1) * PAGE_SIZE, PAGE_SIZE * cursor);
      // we are modifying the post later so we need to shallow copy it
      posts = posts.map(post => ({ ...post }));
      // get users to merge
      await Promise.all(
        posts.map(post =>
          post.author ?
            UserResource.get({ id: post.author })
              .then(user => {
                (post as any).author = user;
                delete (post as any).userId;
                return user;
              })
              .catch(e => {})
          : Promise.resolve({}),
        ),
      );
      if (PAGE_SIZE * cursor >= Object.keys(entities).length)
        return { posts, cursor: null };
      return {
        posts,
        cursor: cursor + 1,
      };
    },
    delay: (...args: Parameters<typeof PostResource.getList>) => {
      const params = args[0] as PostListParams | undefined;
      return params?.cursor ? 200 : 0;
    },
  },
];

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
