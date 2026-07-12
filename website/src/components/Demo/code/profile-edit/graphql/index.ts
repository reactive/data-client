import type { Interceptor } from '@data-client/test';

import { PostResource, UserResource } from './resources';
import { POSTS, USERS } from '../../../../../mocks/handlers';

import NewPost from '!!raw-loader!./NewPost.tsx';
import PostContainer from '!!raw-loader!./PostContainer.tsx';
import PostItem from '!!raw-loader!./PostItem.tsx';
import PostList from '!!raw-loader!./PostList.tsx';
import ProfileEdit from '!!raw-loader!./ProfileEdit.tsx';
import resources from '!!raw-loader!./resources.ts';

type ProfileEditGraphQLState = {
  posts: Record<number, (typeof POSTS)[number]>;
  users: Record<number, (typeof USERS)[number]>;
};

const fixtures: Interceptor<ProfileEditGraphQLState>[] = [
  {
    endpoint: PostResource.getList,
    response() {
      return {
        posts: Object.values(this.posts).map(post => ({
          ...post,
          author: this.users[post.userId],
        })),
      };
    },
    delay: 150,
  },
  {
    endpoint: UserResource.get,
    response({ id }: Parameters<typeof UserResource.get>[0]) {
      return { user: this.users[id] };
    },
    delay: 150,
  },
  {
    endpoint: UserResource.update,
    response(user: Parameters<typeof UserResource.update>[0]) {
      const pk = user.id;
      this.users[pk] = { ...this.users[pk], ...user };
      console.log(this.users[pk]);
      return { updateUser: this.users[pk] };
    },
    // TODO: make this higher number when optimistic is enabled
    delay: 0,
  },
];

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
  fixtures,
  getInitialInterceptorData: (): ProfileEditGraphQLState => ({
    posts: Object.fromEntries(POSTS.map(post => [post.id, post])),
    users: Object.fromEntries(USERS.map(user => [user.id, user])),
  }),
};
