/*import todoAppRestApi from './api.rawts?raw';
import TodoItem from './TodoItem.rawts?raw';
import TodoList from './TodoList.rawts?raw';
import TodoStats from './TodoStats.rawts?raw';*/

import { GQLEndpoint } from '@rest-hooks/graphql';

import apiCode from '!!raw-loader!./api.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import TodoStats from '!!raw-loader!./TodoStats.tsx';

import { TODOS } from '../../../../../mocks/handlers';

export default {
  label: 'GraphQL',
  value: 'graphql',
  fixtures: [
    {
      endpoint: new GQLEndpoint('/').query(`
query GetTodos {
  todo {
    id
    title
    completed
    userId
  }
}
`),
      args: [{}],
      response: { todos: TODOS },
      delay: 150,
    },
  ],
  code: [
    {
      path: 'api',
      code: apiCode,
    },
    {
      path: 'TodoItem',
      open: true,
      code: TodoItem,
    },
    {
      path: 'TodoStats',
      code: TodoStats,
    },
    {
      path: 'TodoList',
      code: TodoList,
    },
  ],
};
