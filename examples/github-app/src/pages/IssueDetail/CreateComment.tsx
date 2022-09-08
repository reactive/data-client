import UserResource from 'resources/User';
import { useCache, useController } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import { Link } from '@anansi/router';
import { memo, useCallback } from 'react';
import { CommentResource } from 'resources/Comment';
import { Issue } from 'resources/Issue';
import { css } from '@linaria/core';

import CommentForm from './CommentForm';

const { Meta } = Card;

const comment = css`
  .ant-card-meta-detail {
    width: 100%;
  }
`;

function CreateComment({ issue }: { issue: Issue }) {
  const currentUser = useCache(UserResource.current);

  if (!currentUser) return null;
  return (
    <Card style={{ marginTop: 16 }}>
      <Meta
        className={comment}
        avatar={
          <Link name="ProfileDetail" props={{ login: currentUser.login }}>
            <Avatar src={currentUser.avatarUrl} />
          </Link>
        }
        title={<>Write</>}
        description={<CreateForm issue={issue} />}
      />
    </Card>
  );
}
export default memo(CreateComment);

function CreateForm({ issue }: { issue: Issue }) {
  const { fetch } = useController();
  const onFinish = useCallback(
    (data: { body: string }) => {
      return fetch(
        CommentResource.create,
        { owner: issue.owner, repo: issue.repo, number: issue.number },
        data,
      );
    },
    [fetch, issue.number, issue.owner, issue.repo],
  );
  return <CommentForm onFinish={onFinish} label="Comment" />;
}
