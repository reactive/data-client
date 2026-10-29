import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

/** The posts behind the axios migration guide's `PostResource` */
const posts: Record<string, { id: string; title: string; body: string }> = {
  '1': { id: '1', title: 'Hello World', body: 'First post' },
  '2': { id: '2', title: 'Second post', body: 'More to say' },
};

export const apiPostFixtures: Interceptor[] = [
  {
    endpoint: new RestEndpoint({
      urlPrefix: 'https://api.example.com',
      path: '/posts/:id',
    }),
    response({ id }: { id: string }) {
      const post = posts[id];
      if (!post) throw { status: 404, message: `No post ${id}` };
      return post;
    },
  },
];
