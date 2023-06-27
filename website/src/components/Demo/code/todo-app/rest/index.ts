import NewTodo from '!!raw-loader!./NewTodo.tsx';
import resources from '!!raw-loader!./resources.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import UserList from '!!raw-loader!./UserList.tsx';

import { TodoResource, UserResource } from './resources';

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
  fixtures: [
    {
      endpoint: UserResource.getList,
      async response(...args: any) {
        const users = (await UserResource.getList(...args)).slice(0, 2);
        const todos = await Promise.allSettled(
          users.map(user => TodoResource.getList({ userId: user.id })),
        );
        users.forEach((user, i) => {
          delete user.address;
          delete user.company;
          user.todos = todos[i].value.slice(0, 3);
        });
        return users;
      },
    },
    {
      endpoint: TodoResource.getList,
      async response(...args: any) {
        return (await TodoResource.getList(...args)).slice(0, 7);
      },
    },
    {
      endpoint: TodoResource.partialUpdate,
      async response(...args: any) {
        return {
          ...(await TodoResource.partialUpdate(...args)),
          id: args?.[0]?.id,
        };
      },
    },
    {
      endpoint: TodoResource.create,
      async response(...args: any) {
        return {
          ...(await TodoResource.create(...args)),
          id: args?.[args.length - 1]?.id,
        };
      },
    },
  ],
};
