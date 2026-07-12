/*import todoAppRestApi from './api.rawts?raw';
import TodoItem from './TodoItem.rawts?raw';
import TodoList from './TodoList.rawts?raw';
import TodoStats from './TodoStats.rawts?raw';*/

import { GQLEndpoint } from '@data-client/graphql';
import type { Interceptor } from '@data-client/test';

import { TodoResource } from './api';
import { TODOS } from '../../../../../mocks/handlers';

import apiCode from '!!raw-loader!./api.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import TodoStats from '!!raw-loader!./TodoStats.tsx';

type TodoGraphQLState = Record<
  number,
  (typeof TODOS)[number] & { updatedAt: number }
>;

const fixtures: Interceptor<TodoGraphQLState>[] = [
  {
    endpoint: TodoResource.getList,
    response() {
      return { todos: Object.values(this) };
    },
    delay: 150,
  },
  {
    endpoint: TodoResource.update,
    response({ todo }: Parameters<typeof TodoResource.update>[0]) {
      const pk = todo.id;
      this[pk] = { ...this[pk], ...todo };
      return { updateTodo: this[pk] };
    },
    delay: 150,
  },
];

export default {
  label: 'GraphQL',
  value: 'graphql',
  fixtures,
  getInitialInterceptorData: (): TodoGraphQLState =>
    Object.fromEntries(
      TODOS.map(todo => [
        todo.id,
        { ...todo, updatedAt: Date.now() },
      ]),
    ),
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
