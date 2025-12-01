import { MatchedRoute } from '@anansi/router';
import { Layout } from 'antd';
import { memo } from 'react';

import Boundary from '@/Boundary';
import NavBar from '@/navigation/NavBar';

import 'antd/dist/reset.css';
import 'style/main.css';

const { Content } = Layout;

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
