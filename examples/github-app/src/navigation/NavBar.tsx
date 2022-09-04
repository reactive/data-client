import { Link, useShowLoading } from '@anansi/router';
import { Layout, Menu, Spin, Affix } from 'antd';
import { Avatar } from 'antd';
import { memo, Suspense, useContext, useState } from 'react';
import { styled } from '@linaria/react';
import { NetworkErrorBoundary, useSuspense } from 'rest-hooks';
import UserResource from 'resources/User';

import LoginModal from './LoginModal';
import { authdContext } from './authdContext';

const { Header } = Layout;

const LoadContainer = styled.li`
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

function NavBar() {
  const loading = useShowLoading(150);
  const [visibleLogin, setVisibleLogin] = useState(false);
  const { authed, logout } = useContext(authdContext);
  return (
    <Affix offsetTop={0}>
      <Header className="header">
        <div className="logo" />
        <LoginModal
          visible={visibleLogin}
          handleClose={() => setVisibleLogin(false)}
        />

        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key={'home'}>
            <Link name="Home">React Issues</Link>
          </Menu.Item>
          <Menu.Item key={'rest-hooks'}>
            <Link
              name="IssueList"
              props={{ repo: 'rest-hooks', owner: 'coinbase' }}
            >
              Rest Hooks Issues
            </Link>
          </Menu.Item>
          {authed ? (
            <>
              <Menu.Item key="profile">
                <NetworkErrorBoundary>
                  <Suspense fallback={null}>
                    <AuthedUser />
                  </Suspense>
                </NetworkErrorBoundary>
              </Menu.Item>
              <Menu.Item key={'auth'} onClick={logout}>
                Logout
              </Menu.Item>
            </>
          ) : (
            <Menu.Item
              key={'auth'}
              onClick={() => setVisibleLogin((visible: boolean) => !visible)}
            >
              Login
            </Menu.Item>
          )}
          {/*<Menu.Item key={'1'}>
            <Link to="/closed">Closed</Link>
          </Menu.Item>
          <Menu.Item key={'2'}>
            <Link to="/open">Open</Link>
  </Menu.Item>*/}
          <LoadContainer>{loading && <Spin />}</LoadContainer>
        </Menu>
      </Header>
    </Affix>
  );
}
export default memo(NavBar);

function AuthedUser() {
  const user = useSuspense(UserResource.current);
  return (
    <Link name="ProfileDetail" props={{ login: user.login }}>
      <Avatar src={user.avatarUrl} />
    </Link>
  );
}
