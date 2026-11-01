import { useController, useSuspense } from '@data-client/react';

import { TodoResource } from '../resources';

export default function Todos() {
  const todos = useSuspense(TodoResource.getList, { userId: 1 });
  const ctrl = useController();
  return (
    <button
      onClick={() =>
        ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'new' })
      }
    >
      {todos.length}
    </button>
  );
}
