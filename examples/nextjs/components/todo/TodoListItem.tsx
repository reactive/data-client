import { useController } from '@data-client/react';
import { memo } from 'react';
import { TodoResource, Todo } from '../../resources/TodoResource';

function TodoListItem({ todo }: { todo: Todo }) {
  const ctrl = useController();

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: e.currentTarget.checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: todo.id,
    });

  return (
    <div style={{textAlign:'left'}}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
        />
        {todo.completed ? <s>{todo.title}</s> : todo.title}
      </label>
      <span
        style={{ cursor: 'pointer', marginLeft: '.5em' }}
        onClick={handleDelete}
      >
        <img
          src="https://dataclient.io/img/cancel.png"
          width="16"
          height="16"
          style={{ marginBottom: '-3px' }}
        />
      </span>
    </div>
  );
}
export default memo(TodoListItem);
