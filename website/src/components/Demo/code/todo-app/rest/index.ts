import NewTodo from '!!raw-loader!./NewTodo.tsx';
import resources from '!!raw-loader!./resources.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import TodoStats from '!!raw-loader!./TodoStats.tsx';

import { TodoResource } from './resources';

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
      open: true,
      code: TodoItem,
    },
    {
      path: 'TodoStats',
      code: TodoStats,
    },
    {
      path: 'NewTodo',
      code: NewTodo,
    },
    {
      path: 'TodoList',
      code: TodoList,
    },
  ],
  fixtures: [
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
