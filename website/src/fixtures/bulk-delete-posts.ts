import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

/** Invalidate.md's `PostResource.deleteMany`: `DELETE /posts?ids=5,13,7` */
const deleteMany = new RestEndpoint({
  path: '/posts',
  searchParams: {} as { ids: string[] },
  method: 'DELETE',
});

/** Answers with the deleted posts' ids */
export const deleteManyFixtures: Interceptor[] = [
  {
    endpoint: deleteMany,
    response: ({ ids }: { ids: string[] }) => ids.map(id => ({ id })),
  },
];

/** Answers with nothing (204) */
export const deleteManyEmptyFixtures: Interceptor[] = [
  { endpoint: deleteMany, response: () => null },
];
