import React from 'react';
import { useSuspense } from 'rest-hooks';
import { Card, List } from 'antd';
import Markdown from 'react-markdown';

import UserResource from '../resources/UserResource';

const { Meta } = Card;

export default function ProfileDetail({ login }: { login: string }) {
  const user = useSuspense(UserResource.detail(), { login });

  const list = [
    user.company,
    user.location,
    user.email,
    user.blog,
    new Intl.DateTimeFormat(navigator.language).format(user.createdAt),
  ].filter((item) => item);

  return (
    <React.Fragment>
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
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </div>
          }
        />
      </Card>
    </React.Fragment>
  );
}
