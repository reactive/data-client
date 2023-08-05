import {
  Entity,
  createResource,
  RestEndpoint,
  AbortOptimistic,
} from '@data-client/rest';
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
      if (!data) throw new AbortOptimistic();
      return {
        votes: data.votes + 1,
      };
    },
  }),
};

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

const delay = 350;

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

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
