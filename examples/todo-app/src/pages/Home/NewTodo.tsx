import { useController } from 'rest-hooks';
import { useCallback, useRef, useState } from 'react';
import { styled } from '@linaria/react';
import { TodoResource, Todo } from 'resources/TodoResource';

export default function NewTodo({ lastId }: { lastId: number }) {
  const { fetch } = useController();
  const [title, setTitle] = useState('');
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setTitle(e.currentTarget.value);
    },
    [],
  );

  // this allows handlePress to never change referential equality
  const payload = useRef({ id: lastId + 1, title: title });
  payload.current = { id: lastId + 1, title: title };

  const handlePress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        fetch(TodoResource.create, payload.current);
        setTitle('');
      }
    },
    [fetch],
  );

  return (
    <TodoBox>
      <input type="checkbox" name="new" checked={false} disabled />{' '}
      <TitleInput
        type="text"
        value={title}
        onChange={handleChange}
        onKeyPress={handlePress}
      />
    </TodoBox>
  );
}
const TodoBox = styled.div`
  text-align: left;
  display: flex;
`;
const TitleInput = styled.input`
  flex: 1 1 auto;
  width: 100%;
  background: #e1e1e1;
  &:focus {
    background: eeeeee;
  }
`;
