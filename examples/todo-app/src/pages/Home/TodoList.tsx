import { useSuspense } from '@rest-hooks/react';
import { TodoResource } from 'resources/TodoResource';

import NewTodo from './NewTodo';
import TodoListItem from './TodoListItem';

export default function TodoList() {
  const todos = useSuspense(TodoResource.getList);

  return (
    <div>
      {todos.map((todo) => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
      <NewTodo lastId={todos.length} />
    </div>
  );
}
