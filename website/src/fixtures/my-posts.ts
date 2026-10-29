import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

/** The posts behind the auth guides' `MyResource` (`path: '/my/:id'`) */
const posts: Record<string, { id: string; title: string }> = {
  '1': { id: '1', title: 'Why wait on data we already have?' },
  '2': { id: '2', title: 'What are atomic mutations?' },
  '3': { id: '3', title: 'Signing in with cookies' },
};

function find({ id }: { id: string | number }) {
  const post = posts[id];
  if (!post) throw { status: 404, message: `No post ${id}` };
  return post;
}
const edit = (params: { id: string | number }, body: object) => ({
  ...find(params),
  ...body,
});

export const myPostFixtures: Interceptor[] = [
  { endpoint: new RestEndpoint({ path: '/my/:id' }), response: find },
  {
    endpoint: new RestEndpoint({ path: '/my/:id', method: 'PUT' }),
    response: edit,
  },
  {
    endpoint: new RestEndpoint({ path: '/my/:id', method: 'PATCH' }),
    response: edit,
  },
];
