import { getTodo } from './api';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, id);
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
