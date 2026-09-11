import TodoList from '@/components/todo/TodoList';

export default async function TodoPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  // Stands in for slow server work (auth, a database call) between the root
  // DataProvider and the Client Components below. The state TodoList fetches
  // still streams to the browser ahead of the HTML rendered from it.
  await new Promise(resolve => setTimeout(resolve, 50));
  return <TodoList userId={Number(params.userId)} />;
}
