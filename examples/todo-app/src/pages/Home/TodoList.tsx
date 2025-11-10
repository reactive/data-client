import { useSuspense } from '@data-client/react';
import { styled } from '@linaria/react';
import { TodoResource } from 'resources/TodoResource';

import TodoListItem from './TodoListItem';

export default function TodoList({ userId }: { userId?: number }) {
  const todos = useSuspense(TodoResource.getList, { userId });

  if (todos.length === 0) {
    return <EmptyState>No todos yet! Add one above to get started.</EmptyState>;
  }

  return (
    <TodosContainer>
      {todos.map((todo) => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
    </TodosContainer>
  );
}

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #9e9e9e;
  font-size: 16px;
`;

const TodosContainer = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;
