import { AsyncBoundary } from '@data-client/react';
import { styled } from '@linaria/react';
import { memo } from 'react';
import LoadingBar from 'components/LoadingBar';
import Home from 'pages/Home';
import 'style/main.css';
import UserSelection from 'pages/Home/UserSelection';
import useNavigationState from 'useNavigationState';

// Typically place global navigation and routing layer in here
function App() {
  const [userId, setUserId, loading] = useNavigationState(1);

  return (
    <AppContainer>
      <LoadingBar duration={500} loading={loading} />
      <AppNav>
        <NavContainer>
          <NavBrand>📝 Todos</NavBrand>
          <AsyncBoundary fallback={<NavLoading>Loading...</NavLoading>}>
            <UserSelection userId={userId} setUserId={setUserId} />
          </AsyncBoundary>
        </NavContainer>
      </AppNav>
      <Home userId={userId} />
    </AppContainer>
  );
}
export default memo(App);

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const AppNav = styled.nav`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
`;

const NavBrand = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
`;

const NavLoading = styled.div`
  color: white;
  font-size: 14px;
  opacity: 0.8;
`;
