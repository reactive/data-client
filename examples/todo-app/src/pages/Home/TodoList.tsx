import { useSuspense } from '@rest-hooks/react';
import { TodoResource } from 'resources/TodoResource';

import NewTodo from './NewTodo';
import TodoListItem from './TodoListItem';

export default function TodoList({ userId }: { userId?: number }) {
  const todos = useSuspense(TodoResource.getList, { userId });

  return (
    <div>
      {todos.map((todo) => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
      <NewTodo userId={userId} />
    </div>
  );
}
