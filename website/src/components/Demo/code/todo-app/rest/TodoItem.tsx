import { TodoResource, type Todo } from './api';

export default function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={e =>
            controller.fetch(
              TodoResource.partialUpdate,
              { id: todo.id },
              { completed: e.currentTarget.checked },
            )
          }
        />
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
      </label>
      <CancelButton
        onClick={() =>
          controller.fetch(TodoResource.delete, {
            id: todo.id,
          })
        }
      />
    </div>
  );
}
