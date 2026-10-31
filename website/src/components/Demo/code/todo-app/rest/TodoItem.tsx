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
  // dropped on another user's list, it moves to theirs
  const handleDrop = (userId: number) =>
    controller.fetch(
      TodoResource.getList.move,
      { id: todo.id },
      { userId },
    );
  return (
    <div
      className="listItem nogap"
      ref={useReorderItem(todo.pk(), { onDrop: handleDrop })}
    >
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleChange}
        />
        {todo.title}
      </label>
      <CancelButton onClick={handleDelete} />
    </div>
  );
}
