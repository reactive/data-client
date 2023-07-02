import { useController } from '@data-client/react';
import { styled } from '@linaria/react';
import { memo, useCallback, useRef } from 'react';
import { TodoResource } from 'resources/TodoResource';
import { v4 as uuid } from 'uuid';

function NewTodo({ userId }: { userId?: number }) {
  const ctrl = useController();

  // this allows handlePress to never change referential equality
  const payload = useRef({ id: 1, userId });
  payload.current = { id: randomId(), userId };

  const handlePress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(TodoResource.create, {
          ...payload.current,
          title: e.currentTarget.value,
        });
        e.currentTarget.value = '';
      }
    },
    [ctrl],
  );

  return (
    <TodoBox>
      <input type="checkbox" name="new" checked={false} disabled />{' '}
      <TitleInput type="text" onKeyDown={handlePress} />
    </TodoBox>
  );
}
export default memo(NewTodo);

const TodoBox = styled.div`
  text-align: left;
  display: flex;
`;
const TitleInput = styled.input`
  flex: 1 1 auto;
  width: 100%;
  background: #efefef;
  opacity: 0.5;
  &:focus,
  &:hover {
    opacity: 1;
  }
`;

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
