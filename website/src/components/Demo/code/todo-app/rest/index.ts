import resources from '!!raw-loader!./resources.ts';
import TodoItem from '!!raw-loader!./TodoItem.tsx';
import TodoList from '!!raw-loader!./TodoList.tsx';
import TodoStats from '!!raw-loader!./TodoStats.tsx';

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
      path: 'TodoList',
      code: TodoList,
    },
  ],
};
