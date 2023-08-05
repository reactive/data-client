import PostItem from '!!raw-loader!./PostItem.tsx';
import PostList from '!!raw-loader!./PostList.tsx';
import ProfileEdit from '!!raw-loader!./ProfileEdit.tsx';
import resources from '!!raw-loader!./resources.ts';

import { PostResource } from './resources';

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
  fixtures: [
    {
      endpoint: PostResource.getList,
      async response(...args: any) {
        return (await PostResource.getList(...args)).slice(0, 4);
      },
    },
    {
      endpoint: PostResource.partialUpdate,
      async response(...args: any) {
        return {
          ...(await PostResource.partialUpdate(...args)),
          id: args?.[0]?.id,
        };
      },
    },
    {
      endpoint: PostResource.getList.push,
      async response(...args: any) {
        return {
          ...(await PostResource.getList.push(...args)),
          id: args?.[args.length - 1]?.id,
        };
      },
    },
  ],
};
