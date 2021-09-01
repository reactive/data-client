import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import Boundary from 'Boundary';

import 'antd/dist/antd.css';
import Routes from './Routes';

const { Header, Content } = Layout;

// Typically place global navigation and routing layer in here
function App() {
  return (
    <Layout>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" selectable={false}>
          <Menu.Item key={'0'}>
            <Link to="/">React Issues</Link>
          </Menu.Item>
          <Menu.Item key={'1'}>
            <Link to="/closed">Closed</Link>
          </Menu.Item>
          <Menu.Item key={'2'}>
            <Link to="/open">Open</Link>
          </Menu.Item>
        </Menu>
      </Header>{' '}
      <Content
        style={{
          background: '#fff',
          padding: 24,
          margin: 0,
          minHeight: 280,
        }}
      >
        <Boundary>
          <Routes />
        </Boundary>
      </Content>
    </Layout>
  );
}
export default memo(App);
