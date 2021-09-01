import React from 'react';
import { useResource } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import Markdown from 'react-markdown';

import UserResource from '../resources/UserResource';

const { Meta } = Card;

export default function ProfileDetail() {
  const user = useResource(UserResource.current(), {});

  return (
    <React.Fragment>
      <Card>
        {user.createdAt.getDay()}
        <Meta
          avatar={<Avatar src={user.avatarUrl} />}
          title={user.name}
          description={<Markdown>{user.bio}</Markdown>}
        />
      </Card>
    </React.Fragment>
  );
}
