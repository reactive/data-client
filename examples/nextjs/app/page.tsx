import TodoLayout from './[userId]/layout';
import TodoPage from './[userId]/page';

export default function Home() {
  return (
    <TodoLayout params={Promise.resolve({ userId: '1' })}>
      <TodoPage params={Promise.resolve({ userId: '1' })} />
    </TodoLayout>
  );
}
