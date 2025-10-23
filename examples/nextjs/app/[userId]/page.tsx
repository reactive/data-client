import TodoList from '@/components/todo/TodoList';

export default async function TodoPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  return <TodoList userId={Number(params.userId)} />;
}
