import {
  Link,
  MatchedRoute,
  ErrorBoundary,
  useController,
} from '@anansi/router';
import { AsyncBoundary } from '@data-client/react';
import { css } from '@linaria/core';
import { memo } from 'react';
import 'style/main.css';

const margin = '8px';

const home = css`
  min-height: 100vh;
  margin: -${margin};
  display: flex;
  align-items: center;
  position: relative;
  flex-direction: column;
  text-align: center;

  > nav {
    position: fixed;
    top: 0;
    padding: 14px 0 10px;
    width: 100%;
    background-color: #0052ff;
  }

  > main {
    margin-top: 44px;
    text-align: left;
  }
`;

// Typically place global navigation and routing layer in here
function App() {
  const { history } = useController();
  return (
    <div className={home}>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        <AsyncBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </AsyncBoundary>
      </main>
    </div>
  );
}
export default memo(App);
