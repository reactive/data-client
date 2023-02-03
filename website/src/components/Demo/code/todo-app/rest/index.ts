import todoAppRestApi from '!!raw-loader!./api.ts';

import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import TodoStats from '!!raw-loader!./TodoStats.tsx';

export default {
  label: 'REST',
  value: 'rest',
  code: [
    {
      path: 'api',
      code: todoAppRestApi,
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
