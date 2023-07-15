import NewTodo from './NewTodo';
import { type Todo } from './resources';
import TodoItem from './TodoItem';

export default function TodoList({ todos, userId }: Props) {
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
      <NewTodo userId={userId} />
    </div>
  );
}
interface Props {
  todos: Todo[];
  userId: number;
}
