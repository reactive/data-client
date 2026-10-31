import type { Interceptor } from '@data-client/test';

import { TodoResource, UserResource } from './resources';
import {
  rememberTodo,
  todoEndpointFixtures,
  type TodoData,
  type TodoServer,
} from '../../../../../fixtures/todos';

import NewTodo from '!!raw-loader!./NewTodo.tsx';
import resources from '!!raw-loader!./resources.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import UserList from '!!raw-loader!./UserList.tsx';

type UserData = Awaited<
  ReturnType<typeof UserResource.getList>
>[number];

const fixtures: Interceptor<TodoServer>[] = [
  {
    endpoint: UserResource.getList,
    async response(...args: Parameters<typeof UserResource.getList>) {
      const users = (await UserResource.getList(...args)).slice(0, 2);
      const todos = await Promise.allSettled(
        users.map((user: UserData) =>
          TodoResource.getList({ userId: user.id }),
        ),
      );
      users.forEach((user: UserData, i: number) => {
        delete user.address;
        delete user.company;
        const result = todos[i];
        user.todos =
          result.status === 'fulfilled'
            ? result.value
                .slice(0, 3)
                .map((todo: TodoData) => rememberTodo(this, todo))
            : [];
      });
      return users;
    },
  },
  ...todoEndpointFixtures,
];

export default {
  label: 'REST',
  value: 'rest',
  code: [
    {
      path: 'resources',
      code: resources,
    },
    {
      path: 'TodoItem',
      code: TodoItem,
    },
    {
      path: 'NewTodo',
      open: true,
      code: NewTodo,
    },
    {
      path: 'TodoList',
      code: TodoList,
    },
    {
      path: 'UserList',
      code: UserList,
    },
  ],
  fixtures,
};
