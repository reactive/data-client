import { TodoResource } from './api';
import TodoItem from './TodoItem';
import TodoStats from './TodoStats';

function TodoList() {
  const { todos } = useSuspense(TodoResource.getList, {});
  return (
    <div>
      <TodoStats />
      <div className="list">
        {todos.map(todo => (
          <TodoItem key={todo.pk()} todo={todo} />
        ))}
      </div>
    </div>
  );
}
render(<TodoList />);
