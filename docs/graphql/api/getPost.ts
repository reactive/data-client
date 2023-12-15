import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('https://fakeapi.com');
export const getPost = gql.query(
  (v: { id: string }) => `query getPost($id: ID!) {
    post(id: $id) {
      id
      author
      createdAt
      content
      title
    }
  }`,
);
