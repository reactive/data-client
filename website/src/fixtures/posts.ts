import { Entity, createResource, RestEndpoint } from '@data-client/rest';
import { v4 as uuid } from 'uuid';

export class Post extends Entity {
  id: number | undefined = undefined;
  title = '';
  body = '';
  votes = 0;

  pk() {
    return this.id?.toString();
  }

  static key = 'Post';

  get img() {
    return `http://placekitten.com/400/200?image=${this.id % 16}`;
  }
}

export const PostResource = {
  ...createResource({
    path: '/posts/:id',
    searchParams: {} as { userId?: string | number } | undefined,
    schema: Post,
  }),
  vote: new RestEndpoint({
    path: '/posts/:id/vote',
    method: 'POST',
    body: undefined,
    name: 'vote',
    schema: Post,
    getOptimisticResponse(snap, { id }) {
      const { data } = snap.getResponse(PostResource.get, { id });
      if (!data) throw snap.abort;
      return {
        votes: data.votes + 1,
      };
    },
  }),
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

  pk() {
    return `${this.id}`;
  }

  static key = 'User';
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});

const entities = {
  '1': {
    id: '1',
    title: 'Why wait on data we already have?',
    body: 'The fastest fetch is the one that never happens. With Reactive Data Client, components use the same global data. This means no waiting when navigating from a list to detail view. No overfetching when data is reused in multiple component instances.',
    votes: 101,
    userId: 1,
  },
  '2': {
    id: '2',
    title: 'Why does user experince matter?',
    body: 'Slow interactions, confusing inconsistent data, UI flickering great a mental burden on your customers. This reduces their productivity and their frustration can make them lose trust.',
    votes: 81,
    userId: 2,
  },
  '3': {
    id: '3',
    title: 'What are atomic mutations?',
    body: 'Atomic means indivisible. Atomic mutations reactively update every usage on or off screen at the same time. This eliminates data tearing while improving performance.',
    votes: 73,
    userId: 2,
  },
};

export const getInitialInterceptorData = () => ({ entities: {} });

const delay = 150;

export const postFixtures = [
  {
    endpoint: PostResource.get,
    response({ id }) {
      return {
        id,
        votes: 0,
        ...entities[id],
      };
    },
    delay,
  },
  {
    endpoint: PostResource.getList,
    response(...args) {
      if (args.length) {
        return Object.values(entities).filter(
          post => post.userId === args[0].userId,
        );
      }
      return Object.values(entities);
    },
    delay,
  },
  {
    endpoint: PostResource.vote,
    response({ id }) {
      return {
        id,
        votes: (this.votes[id] = (this.votes[id] ?? entities[id].votes) + 1),
      };
    },
    delay: () => 500 + Math.random() * 4500,
  },
  {
    endpoint: PostResource.update,
    response({ id }, body) {
      this.entities[id] = {
        id,
        votes: 0,
        ...entities[id],
        ...body,
      };
      for (const [key, value] of body.entries()) {
        this.entities[id][key] = value;
      }
      return this.entities[id];
    },
    delay: 500,
  },
  {
    endpoint: PostResource.getList.push,
    response(body) {
      const id = randomId();
      this.entities[id] = { id, userId: 1 };
      for (const [key, value] of body.entries()) {
        this.entities[id][key] = value;
      }
      return this.entities[id];
    },
    delay: 500,
  },
];

const extendedEntities = {
  ...entities,
  '4': {
    id: '4',
    title: 'The second page of posts starts here',
    body: 'Next thing',
    votes: 23,
    userId: 2,
  },
  '5': {
    id: '5',
    title: 'More posts for this page',
    body: 'More stuff',
    votes: 7,
    userId: 1,
  },
  '6': {
    id: '6',
    title: 'This is the last item',
    body: 'Oh my',
    votes: 10,
    userId: 3,
  },
};

export const postPaginatedFixtures = [
  {
    endpoint: PostResource.getList,
    async response(...args) {
      const cursor = args?.[0]?.cursor ?? 1;
      const userId = args?.[0]?.userId;
      let results = Object.values(extendedEntities);
      if (userId) {
        results = Object.values(extendedEntities).filter(
          post => post.userId === args[0].userId,
        );
      }
      const PAGE_SIZE = 3;
      results = results.slice((cursor - 1) * PAGE_SIZE, PAGE_SIZE * cursor);
      // we are modifying the post later so we need to shallow copy it
      results = results.map(post => ({ ...post }));
      // get users to merge
      await Promise.all(
        results.map(post =>
          post.userId ?
            UserResource.get({ id: post.userId })
              .then(user => {
                (post as any).author = user;
                delete (post as any).userId;
                return user;
              })
              .catch(e => {})
          : Promise.resolve({}),
        ),
      );
      if (PAGE_SIZE * cursor >= Object.keys(extendedEntities).length)
        return { results, cursor: null };
      return {
        results,
        cursor: cursor + 1,
      };
    },
  },
];

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
