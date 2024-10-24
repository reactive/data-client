import TodoList from '@/components/todo/TodoList';

export default async function TodoPage(props: {
  params: Promise<{ userId: number }>;
}) {
  return <TodoList {...await props.params} />;
}
