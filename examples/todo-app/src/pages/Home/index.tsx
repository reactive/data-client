import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import Boundary from 'Boundary';

import TodoListComponent from './TodoListComponent';

export default function Home() {
  return (
    <div className={home}>
      <Title>Todo List</Title>
      <main style={{ paddingTop: '50px' }}>
        <Boundary>
          <TodoListComponent />
        </Boundary>
      </main>
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
