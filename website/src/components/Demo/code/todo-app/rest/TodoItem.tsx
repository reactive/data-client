import { TodoResource, type Todo } from './resources';

export default function TodoItem({ todo }: { todo: Todo }) {
  const controller = useController();
  const handleChange = e =>
    controller.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: e.currentTarget.checked },
    );
  const handleDelete = () =>
    controller.fetch(TodoResource.delete, {
      id: todo.id,
    });
  return (
    <div className="listItem nogap">
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleChange}
        />
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
      </label>
      <CancelButton onClick={handleDelete} />
    </div>
  );
}
