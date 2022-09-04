import React, { useMemo } from 'react';
import { useSuspense } from 'rest-hooks';
import { Card, List, Layout, Space, Timeline, Typography, Divider } from 'antd';
import Markdown from 'react-markdown';
import { Link } from '@anansi/router';
import { UserResource, User } from 'resources/User';
import RepositoryResource, { Repository } from 'resources/Repository';
import { ForkOutlined, StarOutlined } from '@ant-design/icons';
import { EventResource, typeToIcon, Event } from 'resources/Event';
import { groupBy } from 'lodash';

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
