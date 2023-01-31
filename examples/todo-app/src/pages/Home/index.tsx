import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { AsyncBoundary } from '@rest-hooks/react';
import useNavigationState from 'useNavigationState';

import TodoList from './TodoList';
import TodoStats from './TodoStats';
import UserSelection from './UserSelection';

export default function Home() {
  const [userId, setUserId] = useNavigationState(1);
  return (
    <div className={home}>
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

const margin = '8px';

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
  padding: 18px;
  background: white;
  z-index: 100;
`;

const Main = styled.main`
  padding: 50px 10px 0 10px;
  max-width: 800px;
`;
