import {
  GQLEndpoint,
  GQLEntity,
  Collection,
} from '@data-client/graphql';

const gql = new GQLEndpoint('/');

export class User extends GQLEntity {
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }
}

export class Post extends GQLEntity {
  title = '';
  body = '';
  author = User.fromJS();

  static schema = {
    author: User,
  };
}

export const PostResource = {
  getList: gql.query(
    `query GetPosts($userId: ID) {
    post {
      id
      title
      body
      user {
        id
        name
        username
        email
        phone
        website
      }
    }
  }
`,
    { posts: new Collection([Post]) },
  ),
};

export const UserResource = {
  get: gql.query(
    `query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      username
      email
      phone
      website
    }
  }
`,
    { user: User },
  ),
  update: gql.mutation(
    `mutation UpdateUser($user: User!) {
      updateUser(user: $user) {
        id
        name
        username
        email
        phone
        website
    }
  }`,
    { updateUser: User },
  ),
};
