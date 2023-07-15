import {
  Entity,
  createResource,
  RestEndpoint,
  AbortOptimistic,
} from '@data-client/rest';

export class Post extends Entity {
  id: number | undefined = undefined;
  title = '';
  body = '';
  votes = 0;

  pk() {
    return this.id?.toString();
  }

  get img() {
    return `http://placekitten.com/400/200?image=${this.id}`;
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
    title: 'What are atomic mutations?',
    body: 'Atomic means indivisible. Atomic mutations reactively update every usage on or off screen at the same time. This eliminates data tearing while improving performance.',
    votes: 101,
  },
  '2': {
    id: '2',
    title: 'Why does user experince matter?',
    body: 'Slow interactions, confusing inconsistent data, ui flickering great a mental burden on your customers. This reduces their productivity and their frustration can make them lose trust.',
    votes: 73,
  },
};

const delay = 250;

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
    response({ userId }) {
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
];
