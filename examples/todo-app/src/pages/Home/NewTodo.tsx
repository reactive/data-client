import { useController, useLoading } from '@data-client/react';
import { styled } from '@linaria/react';
import { memo, useCallback, useRef } from 'react';
import { TodoResource } from 'resources/TodoResource';

function NewTodo({ userId }: { userId?: number }) {
  const ctrl = useController();
  const inputRef = useRef<HTMLInputElement>(null);
  const [handleAdd, isLoading] = useLoading(async () => {
    const value = inputRef.current?.value.trim() || '';
    if (!value) return;
    await ctrl.fetch(
      TodoResource.getList.unshift,
      { userId },
      {
        title: value,
        userId,
        completed: false,
      },
    );
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [ctrl, userId]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <AddTodo>
      <TodoInput
        ref={inputRef}
        onKeyUp={handleKeyPress}
        placeholder="What needs to be done?"
        disabled={isLoading}
      />
      <AddBtn onClick={handleAdd} disabled={isLoading}>
        {isLoading ? ' ... ' : 'Add'}
      </AddBtn>
    </AddTodo>
  );
}
export default memo(NewTodo);

const AddTodo = styled.div`
  display: flex;
  padding: 20px;
  gap: 12px;
  border-bottom: 2px solid #e0e0e0;
`;

const TodoInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const AddBtn = styled.button`
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #5568d3;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
