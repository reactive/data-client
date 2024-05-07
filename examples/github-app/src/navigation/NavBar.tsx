import { Link, useShowLoading } from '@anansi/router';
import { AsyncBoundary, useCache, useSuspense } from '@data-client/react';
import { Layout, Menu, Spin, Affix, MenuProps } from 'antd';
import { Avatar } from 'antd';
import { memo, useContext, useMemo, useState } from 'react';
import UserResource from 'resources/User';

import { authdContext } from './authdContext';
import LoginModal from './LoginModal';

const { Header } = Layout;

function NavBar() {
  const loading = useShowLoading(150);
  const [visibleLogin, setVisibleLogin] = useState(false);
  const user = useCache(UserResource.current);
  const { logout } = useContext(authdContext);

  const menuItems = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: 'home',
        label: <Link name="Home">React Issues</Link>,
      },
      {
        key: 'data-client',
        label: (
          <Link
            name="IssueList"
            props={{ repo: 'data-client', owner: 'reactive' }}
          >
            Data Client Issues
          </Link>
        ),
      },
    ];
    if (user) {
      items.push(
        {
          key: 'profile',
          label: (
            <AsyncBoundary>
              <AuthedUser />
            </AsyncBoundary>
          ),
        },
        {
          key: 'auth',
          label: 'Logout',
          onClick: logout,
        },
      );
    } else {
      items.push({
        key: 'auth',
        onClick: () => setVisibleLogin((visible: boolean) => !visible),
        label: 'Login',
      });
    }
    items.push({
      key: 'loading',
      label: loading && <Spin />,
    });
    return items;
  }, [loading, logout, user]);
  return (
    <Affix offsetTop={0}>
      <Header className="header">
        <div className="logo" />
        <LoginModal
          visible={visibleLogin}
          handleClose={() => setVisibleLogin(false)}
        />

        <Menu
          theme="dark"
          mode="horizontal"
          selectable={false}
          items={menuItems}
        />
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
