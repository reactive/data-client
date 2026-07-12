import type { Interceptor } from '@data-client/test';

import { PostResource } from './resources';

import PostItem from '!!raw-loader!./PostItem.tsx';
import PostList from '!!raw-loader!./PostList.tsx';
import ProfileEdit from '!!raw-loader!./ProfileEdit.tsx';
import resources from '!!raw-loader!./resources.ts';

const fixtures: Interceptor[] = [
  {
    endpoint: PostResource.getList,
    async response(...args: Parameters<typeof PostResource.getList>) {
      return (await PostResource.getList(...args)).slice(0, 4);
    },
  },
  {
    endpoint: PostResource.partialUpdate,
    async response(
      ...args: Parameters<typeof PostResource.partialUpdate>
    ) {
      return {
        ...(await PostResource.partialUpdate(...args)),
        id: args?.[0]?.id,
      };
    },
  },
  {
    endpoint: PostResource.getList.push,
    async response(
      ...args: Parameters<typeof PostResource.getList.push>
    ) {
      const lastArg = args[args.length - 1];
      return {
        ...(await PostResource.getList.push(...args)),
        id:
          typeof lastArg === 'object' &&
          lastArg !== null &&
          'id' in lastArg
            ? (lastArg as { id?: number }).id
            : undefined,
      };
    },
  },
];

export default {
  label: 'REST',
  value: 'rest',
  code: [
    {
      path: 'resources',
      code: resources,
    },
    {
      path: 'PostItem',
      code: PostItem,
    },
    {
      path: 'ProfileEdit',
      open: true,
      code: ProfileEdit,
    },
    {
      path: 'PostList',
      code: PostList,
    },
  ],
  fixtures,
};
