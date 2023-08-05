import { Link } from '@anansi/router';
import { useCache, useController } from '@data-client/react';
import { css } from '@linaria/core';
import { Card, Avatar } from 'antd';
import { memo, useCallback } from 'react';
import { CommentResource } from 'resources/Comment';
import { Issue } from 'resources/Issue';
import UserResource from 'resources/User';

import CommentForm from './CommentForm';

const { Meta } = Card;

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

const comment = css`
  .ant-card-meta-detail {
    width: 100%;
  }
`;

function CreateForm({ issue }: { issue: Issue }) {
  const ctrl = useController();
  const onFinish = useCallback(
    (data: { body: string }) => {
      return ctrl.fetch(
        CommentResource.getList.push,
        { owner: issue.owner, repo: issue.repo, number: issue.number },
        data,
      );
    },
    [ctrl, issue.number, issue.owner, issue.repo],
  );
  return <CommentForm onFinish={onFinish} label="Comment" />;
}
