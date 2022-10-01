import { useController } from 'rest-hooks';
import { styled } from '@linaria/react';
import { memo, useCallback } from 'react';
import { TodoResource, Todo } from 'resources/TodoResource';

function TodoListItem({ todo }: { todo: Todo }) {
  const controller = useController();

  const toggleHandler = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await controller.fetch(
        TodoResource.partialUpdate,
        { id: todo.id },
        { completed: e.currentTarget.checked },
      );
    },
    [controller, todo.id],
  );
  return (
    <TodoBox>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleHandler}
      />
      {todo.title}
    </TodoBox>
  );
}
export default memo(TodoListItem);

const TodoBox = styled.div`
  text-align: left;
`;
