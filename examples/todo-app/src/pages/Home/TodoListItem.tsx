import { useController } from '@data-client/react';
import { styled } from '@linaria/react';
import { memo, useCallback } from 'react';
import { TodoResource, Todo } from 'resources/TodoResource';

function TodoListItem({ todo }: { todo: Todo }) {
  const ctrl = useController();

  const toggleHandler = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await ctrl.fetch(
        TodoResource.partialUpdate,
        { id: todo.id },
        { completed: e.currentTarget.checked },
      );
    },
    [ctrl, todo.id],
  );
  return (
    <TodoBox>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={toggleHandler}
        />
        {todo.completed ? <s>{todo.title}</s> : todo.title}
      </label>
      <span
        style={{ cursor: 'pointer', marginLeft: '.5em' }}
        onClick={() =>
          ctrl.fetch(TodoResource.delete, {
            id: todo.id,
          })
        }
      >
        <img
          src="https://resthooks.io/img/cancel.png"
          width="16"
          height="16"
          style={{ marginBottom: '-3px' }}
        />
      </span>
    </TodoBox>
  );
}
export default memo(TodoListItem);

const TodoBox = styled.div`
  text-align: left;
`;
