import { useFetcher } from 'rest-hooks';
import { styled } from '@linaria/react';
import { memo, useCallback } from 'react';

import TodoResource from 'resources/TodoResource';

function TodoListItem({ todo }: { todo: TodoResource }) {
  const partialUpdate = useFetcher(TodoResource.partialUpdate());

  const toggleHandler = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await partialUpdate(
        { id: todo.id },
        { completed: e.currentTarget.checked },
      );
    },
    [partialUpdate, todo.id],
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
