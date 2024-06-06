'use client';
import TodoList from '../../components/todo/TodoList';

export default function TodoPage({ params }: { params: { userId: number } }) {
  return (
    <TodoList {...params} />
  );
}
