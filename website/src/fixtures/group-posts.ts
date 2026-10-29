import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

/** The posts behind resource.md's `PostResource`
 * (`path: '/:group/posts/:id'`, `searchParams: { author }`) */
interface Post {
  id: string;
  group: string;
  title: string;
  author: string;
}
const posts: Post[] = [
  { id: '1', group: 'react', title: 'this post', author: 'clara' },
  { id: '2', group: 'react', title: 'that post', author: 'ana' },
  { id: '3', group: 'vue', title: 'another post', author: 'clara' },
  { id: '4', group: 'react', title: 'next post', author: 'clara' },
  { id: '5', group: 'react', title: 'second page', author: 'clara' },
];
const PAGE_SIZE = 2;

type ItemParams = { group: string; id: string | number };
type ListParams = { group: string; author?: string; page?: number };

function find({ group, id }: ItemParams) {
  const post = posts.find(post => post.group === group && post.id === `${id}`);
  if (!post) throw { status: 404, message: `No post ${group}/${id}` };
  return post;
}

export const groupPostFixtures: Interceptor[] = [
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id' }),
    response: find,
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id', method: 'PUT' }),
    response: (params: ItemParams, body: Partial<Post>) => ({
      ...find(params),
      ...body,
    }),
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id', method: 'PATCH' }),
    response: (params: ItemParams, body: Partial<Post>) => ({
      ...find(params),
      ...body,
    }),
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id', method: 'DELETE' }),
    response: (params: ItemParams) => ({ id: find(params).id }),
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts' }),
    response({ group, author, page = 1 }: ListParams) {
      const list = posts.filter(
        post => post.group === group && (!author || post.author === author),
      );
      return list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    },
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts', method: 'POST' }),
    response: ({ group, author = '' }: ListParams, body: Partial<Post>) => ({
      id: '6',
      group,
      author,
      title: '',
      ...body,
    }),
  },
];
