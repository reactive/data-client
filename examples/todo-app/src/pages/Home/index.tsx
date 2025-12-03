import { AsyncBoundary, useSuspense } from '@data-client/react';
import { styled } from '@linaria/react';
import { UserResource } from 'resources/UserResource';

import NewTodo from './NewTodo';
import TodoList from './TodoList';
import TodoStats from './TodoStats';

export default function Home({ userId }: { userId: number }) {
  return (
    <HomeContainer>
      <TodoCard>
        <Header>
          <AsyncBoundary fallback={<h1>📝 Todo App</h1>}>
            <UserHeader userId={userId} />
          </AsyncBoundary>
        </Header>
        <AsyncBoundary fallback={<Loading>Loading todos...</Loading>}>
          <NewTodo userId={userId} />
          <TodoList userId={userId} />
          <TodoStats userId={userId} />
        </AsyncBoundary>
      </TodoCard>
    </HomeContainer>
  );
}

function UserHeader({ userId }: { userId: number }) {
  const user = useSuspense(UserResource.get, { id: userId });
  return (
    <div>
      <h1>📝 {user.name}'s Todos</h1>
      <Subtitle>@{user.username}</Subtitle>
    </div>
  );
}

const HomeContainer = styled.main`
  max-width: 600px;
  margin: 20px auto;

  @media (max-width: 768px) {
    margin: 20px 12px;
  }
`;

const TodoCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;

  h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
`;

const Loading = styled.div`
  padding: 40px;
  text-align: center;
  color: #9e9e9e;
  font-size: 16px;
`;
