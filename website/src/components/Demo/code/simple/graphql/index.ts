import { GQLEndpoint } from '@data-client/graphql';

import api from '!!raw-loader!./api.ts';
import Demo from '!!raw-loader!./Demo.tsx';

import { TODOS } from '../../../../../mocks/handlers';

export default {
  label: 'GraphQL',
  value: 'graphql',
  autoFocus: true,
  fixtures: [
    {
      endpoint: new GQLEndpoint('/').query(`
query GetTodo($id: ID!) {
  todo(id: $id) {
    id
    title
    completed
  }
}
`),
      response({ id }) {
        return { todo: this[id] };
      },
      delay: 150,
    },
  ],
  getInitialInterceptorData: () =>
    Object.fromEntries(
      TODOS.map(todo => [
        todo.id,
        { ...todo, updatedAt: Date.now() },
      ]),
    ),
  code: [
    {
      path: 'api',
      code: api,
    },
    {
      path: 'react',
      open: true,
      code: Demo,
    },
  ],
};
