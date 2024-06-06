import TodoLayout from './[userId]/layout';
import TodoPage from './[userId]/page';

export default function Home() {
  return (
    <TodoLayout params={{ userId: 1 }}>
      <TodoPage params={{ userId: 1 }} />
    </TodoLayout>
  );
}
