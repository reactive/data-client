import { TodoResource } from './api';
import TodoItem from './TodoItem';
import TodoStats from './TodoStats';

function TodoList() {
  const userId = 1;
  const todos = useSuspense(TodoResource.getList, { userId });
  return (
    <div>
      <TodoStats userId={userId} />
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
render(<TodoList />);
