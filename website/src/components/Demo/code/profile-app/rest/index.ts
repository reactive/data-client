import PostItem from '!!raw-loader!./PostItem.tsx';
import PostList from '!!raw-loader!./PostList.tsx';
import ProfileEdit from '!!raw-loader!./ProfileEdit.tsx';
import resources from '!!raw-loader!./resources.ts';

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
};
