import { css } from '@linaria/core';
import { styled } from '@linaria/react';

import TodoListComponent from './TodoListComponent';

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
  background: #4516f0;
  z-index: 100;
`;

export default function Home() {
  return (
    <div className={home}>
      <Title>Todo List</Title>
      <main style={{ paddingTop: '50px' }}>
        <TodoListComponent />
      </main>
    </div>
  );
}
