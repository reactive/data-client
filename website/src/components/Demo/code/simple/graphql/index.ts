import { GQLEndpoint } from '@rest-hooks/graphql';

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
      args: [{ id: 1 }],
      response: { todo: TODOS.find(todo => todo.id === 1) },
      delay: 150,
    },
  ],
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
