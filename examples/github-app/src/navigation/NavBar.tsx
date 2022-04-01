import { Link, useShowLoading } from '@anansi/router';
import { Layout, Menu, Spin, Affix } from 'antd';
import { memo } from 'react';
import { styled } from '@linaria/react';

const { Header } = Layout;

const LoadContainer = styled.li`
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: end;
`;

function NavBar() {
  const loading = useShowLoading(150);
  return (
    <Affix offsetTop={0}>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key={'0'}>
            <Link name="Home">React Issues</Link>
          </Menu.Item>
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
