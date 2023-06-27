import NewTodo from './NewTodo';
import { type Todo } from './resources';
import TodoItem from './TodoItem';

export default function TodoList({
  todos,
  userId,
}: {
  todos: Todo[];
  userId: number;
}) {
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
      <NewTodo userId={userId} />
    </div>
  );
}
