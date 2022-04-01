import React, { memo } from 'react';
import { Layout, Menu } from 'antd';
import Boundary from 'Boundary';
import { MatchedRoute, Link } from '@anansi/router';
import 'antd/dist/antd.css';
import NavBar from 'navigation/NavBar';

const { Header, Content } = Layout;

// Typically place global navigation and routing layer in here
function App() {
  return (
    <Layout>
      <NavBar />
      <Content
        style={{
          background: '#fff',
          padding: 24,
          margin: 0,
          minHeight: 280,
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
