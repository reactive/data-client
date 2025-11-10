import { useController } from '@data-client/react';
import { styled } from '@linaria/react';
import { memo } from 'react';
import { TodoResource, Todo } from 'resources/TodoResource';

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
    <TodoItem completed={todo.completed}>
      <Checkbox
        type="checkbox"
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onChange={handleToggle}
      />
      <Label htmlFor={`todo-${todo.id}`}>{todo.title}</Label>
      <DeleteBtn onClick={handleDelete}>×</DeleteBtn>
    </TodoItem>
  );
}
export default memo(TodoListItem);

const TodoItem = styled.div<{ completed: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  ${(props) =>
    props.completed
      ? `
    label {
      text-decoration: line-through;
      color: #9e9e9e;
    }
  `
      : ''}
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const Label = styled.label`
  flex: 1;
  cursor: pointer;
  font-size: 16px;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #f44336;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ffebee;
  }
`;
