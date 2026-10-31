import { TodoResource, type Todo } from './api';

export default function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  return (
    <div className="listItem nogap">
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={e =>
            controller.fetch(TodoResource.update, {
              todo: { id: todo.id, completed: e.currentTarget.checked },
            })
          }
        />
        {todo.title}
      </label>
    </div>
  );
}
