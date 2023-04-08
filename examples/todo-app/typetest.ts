import { useCache, useController, useSuspense } from '@rest-hooks/react';

import { queryRemaining, TodoResource } from './src/resources/TodoResource';
import { UserResource } from './src/resources/UserResource';

function useTest() {
  const ctrl = useController();
  const payload = { id: 1, title: '', userId: 1 };
  ctrl.fetch(TodoResource.create, payload);

  const todos = useSuspense(TodoResource.getList, { userId: 1 });
  useSuspense(TodoResource.getList);
  todos.map((todo) => {
    todo.pk();
    todo.title;
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: true },
    );
  });

  const remaining = useCache(queryRemaining, { userId: 1 });

  const users = useSuspense(UserResource.getList);
  users.map((user) => {
    user.name;
  });
}