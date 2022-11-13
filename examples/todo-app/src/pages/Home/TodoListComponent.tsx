import { TodoResource, Todo } from 'resources/TodoResource';
import { useSuspense } from 'rest-hooks';

import NewTodo from './NewTodo';
import TodoListItem from './TodoListItem';

export default function TodoListComponent() {
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
