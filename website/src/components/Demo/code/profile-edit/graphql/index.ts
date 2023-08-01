import PostItem from '!!raw-loader!./PostItem.tsx';
import PostList from '!!raw-loader!./PostList.tsx';
import ProfileEdit from '!!raw-loader!./ProfileEdit.tsx';
import resources from '!!raw-loader!./resources.ts';

import { PostResource, UserResource } from './resources';
import { POSTS, USERS } from '../../../../../mocks/handlers';

import NewPost from '!!raw-loader!./NewPost.tsx';
import PostContainer from '!!raw-loader!./PostContainer.tsx';

export default {
  label: 'GraphQL',
  value: 'graphql',
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
      response() {
        return {
          posts: Object.values(this.posts).map((post: any) => ({
            ...post,
            author: this.users[post.userId],
          })),
        };
      },
      delay: 150,
    },
    {
      endpoint: UserResource.get,
      response({ id }) {
        return { user: this.users[id] };
      },
      delay: 150,
    },
    {
      endpoint: UserResource.update,
      response(user) {
        const pk = user.id;
        this.users[pk] = { ...this.users[pk], ...user };
        console.log(this.users[pk]);
        return { updateUser: this.users[pk] };
      },
      // TODO: make this higher number when optimistic is enabled
      delay: 0,
    },
  ],
  getInitialInterceptorData: () => ({
    posts: Object.fromEntries(POSTS.map(post => [post.id, post])),
    users: Object.fromEntries(USERS.map(user => [user.id, user])),
  }),
};
