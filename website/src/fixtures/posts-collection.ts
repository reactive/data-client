import { Entity, RestEndpoint, Collection } from '@data-client/rest';
import { v4 as uuid } from 'uuid';

class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
export const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    nonFilterArgumentKeys: /orderBy/,
  }),
});

const entities = {
  '1': {
    id: '1',
    title: 'Why wait on data we already have?',
    body: 'The fastest fetch is the one that never happens. With Reactive Data Client, components use the same global data. This means no waiting when navigating from a list to detail view. No overfetching when data is reused in multiple component instances.',
    author: 'bob',
    group: 'react',
  },
  '2': {
    id: '2',
    title: 'Why does user experince matter?',
    body: 'Slow interactions, confusing inconsistent data, UI flickering great a mental burden on your customers. This reduces their productivity and their frustration can make them lose trust.',
    author: 'clara',
    group: 'react',
  },
  '3': {
    id: '3',
    title: 'What are atomic mutations?',
    body: 'Atomic means indivisible. Atomic mutations reactively update every usage on or off screen at the same time. This eliminates data tearing while improving performance.',
    author: 'clara',
    group: 'react',
  },
};

export const getInitialInterceptorData = () => ({ entities: {} });

const delay = 150;

export const postFixtures = [
  {
    endpoint: getPosts,
    response(...args) {
      if (args[0]?.author) {
        return Object.values(entities).filter(
          post => post.author === args[0].author,
        );
      }
      return Object.values(entities);
    },
    delay,
  },
  {
    endpoint: getPosts.push,
    response({ group }, body) {
      const id = randomId();
      this.entities[id] = { id, group };
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

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
