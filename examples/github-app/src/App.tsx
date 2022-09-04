import React, { memo } from 'react';
import { Layout, Menu } from 'antd';
import Boundary, { Loading } from 'Boundary';
import { MatchedRoute, Link } from '@anansi/router';
import 'antd/dist/antd.css';
import 'style/main.scss';
import NavBar from 'navigation/NavBar';
import FlexRow from 'components/FlexRow';

const { Header, Content } = Layout;

// Typically place global navigation and routing layer in here
function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Content
        style={{
          background: '#fff',
          padding: 24,
          margin: 0,
          minHeight: 280,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Boundary>
          <MatchedRoute />
        </Boundary>
      </Content>
    </Layout>
  );
}
export default memo(App);
