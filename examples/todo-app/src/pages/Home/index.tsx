import { AsyncBoundary } from '@data-client/react';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import LoadingBar from 'components/LoadingBar';
import useNavigationState from 'useNavigationState';

import TodoList from './TodoList';
import TodoStats from './TodoStats';
import UserSelection from './UserSelection';

export default function Home() {
  const [userId, setUserId, loading] = useNavigationState(1);
  return (
    <div className={home}>
      <LoadingBar duration={100} loading={loading} />
      <Title>Todo List</Title>
      <Main>
        <AsyncBoundary>
          <UserSelection userId={userId} setUserId={setUserId} />
          <AsyncBoundary>
            <TodoStats userId={userId} />
            <TodoList userId={userId} />
          </AsyncBoundary>
        </AsyncBoundary>
      </Main>
    </div>
  );
}

const margin = '0px';

const home = css`
  min-height: 100vh;
  margin: -${margin};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
  text-align: center;
`;

const Title = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  padding: 15px;
  background: white;
  z-index: 100;
`;

const Main = styled.main`
  padding: 60px 10px 0 10px;
  max-width: 800px;
`;
