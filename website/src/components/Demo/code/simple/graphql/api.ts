import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');
export const getTodo = gql.query(`query GetTodo($id: ID!) {
  todo(id: $id) {
    id
    title
    completed
  }
}
`);
