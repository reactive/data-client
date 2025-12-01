import { useNavigator } from '@anansi/core';
import { useSuspense } from '@data-client/react';
import { Intl } from '@js-temporal/polyfill';
import { Card, Layout } from 'antd';
import Markdown from 'react-markdown';

import { UserResource } from '@/resources/User';

import UserEvents from './UserEvents';
import UserRepositories from './UserRepos';

const { Meta } = Card;
const { Sider, Content } = Layout;

export default function ProfileDetail({ login }: { login: string }) {
  const { language } = useNavigator();
  const user = useSuspense(UserResource.get, { login });

  const list = [
    user.company,
    user.location,
    user.email,
    user.blog,
    new Intl.DateTimeFormat(language).format(user.createdAt),
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
                <div style={{ marginTop: 8 }}>
                  {list.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 0',
                        borderBottom:
                          index < list.length - 1
                            ? '1px solid rgba(0, 0, 0, 0.06)'
                            : 'none',
                      }}
                    >
                      {item.startsWith('http') ? (
                        <a href={item} target="_blank" rel="noreferrer">
                          {item}
                        </a>
                      ) : (
                        item
                      )}
                    </div>
                  ))}
                </div>
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
