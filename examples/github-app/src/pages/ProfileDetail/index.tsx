import { useSuspense } from '@data-client/react';
import { Intl } from '@js-temporal/polyfill';
import { Card, List, Layout, Typography } from 'antd';
import Markdown from 'react-markdown';

import { UserResource } from '@/resources/User';

import UserEvents from './UserEvents';
import UserRepositories from './UserRepos';

const { Meta } = Card;
const { Sider, Content } = Layout;
const { Title } = Typography;

export default function ProfileDetail({ login }: { login: string }) {
  const user = useSuspense(UserResource.get, { login });

  const list = [
    user.company,
    user.location,
    user.email,
    user.blog,
    new Intl.DateTimeFormat(navigator.language).format(user.createdAt),
  ].filter((item) => item);

  return (
    <Layout>
      <Sider width={240} theme="light">
        <Card
          style={{ width: 240 }}
          cover={<img alt={user.login} src={user.avatarUrl} />}
        >
          <Meta
            title={
              <a href={user.htmlUrl} target="_blank" rel="noreferrer noopener">
                {user.name || user.login}
              </a>
            }
            description={
              <div>
                <Markdown>{user.bio}</Markdown>
                <List
                  dataSource={list}
                  renderItem={(item) => (
                    <List.Item>
                      {item.startsWith('http') ? (
                        <a href={item} target="_blank" rel="noreferrer">
                          {item}
                        </a>
                      ) : (
                        item
                      )}
                    </List.Item>
                  )}
                />
              </div>
            }
          />
        </Card>
      </Sider>
      <Content
        style={{
          background: '#fff',
          padding: '0 24px',
          margin: 0,
          minHeight: 280,
        }}
      >
        <UserRepositories user={user} />
        <UserEvents user={user} />
      </Content>
    </Layout>
  );
}
