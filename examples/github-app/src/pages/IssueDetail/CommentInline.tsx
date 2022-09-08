import React, { memo, useCallback, useState } from 'react';
import { useCache, useController } from 'rest-hooks';
import { Card, Avatar, Button, Tag, Popover } from 'antd';
import Markdown from 'react-markdown';
import { Link, useRoutes } from '@anansi/router';
import remarkGfm from 'remark-gfm';
import remarkRemoveComments from 'remark-remove-comments';
import rehypeHighlight from 'rehype-highlight';
import { UserResource } from 'resources/User';
import { css } from '@linaria/core';
import { EllipsisOutlined } from '@ant-design/icons';
import { CommentResource, Comment } from 'resources/Comment';
import FlexRow from 'components/FlexRow';

import CommentForm from './CommentForm';

const { Meta } = Card;

const commentList = css`
  .ant-card-meta-detail {
    width: 100%;
  }
`;

function CommentInline({ comment }: { comment: Comment }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card style={{ marginTop: 16 }} className={commentList}>
      <Meta
        avatar={
          <Link name="ProfileDetail" props={{ login: comment.user.login }}>
            <Avatar src={comment.user.avatarUrl} />
          </Link>
        }
        title={
          <FlexRow>
            <span>
              <Link name="ProfileDetail" props={{ login: comment.user.login }}>
                {comment.user.login}
              </Link>{' '}
              commented on{' '}
              {new Intl.DateTimeFormat(navigator.language).format(
                comment.createdAt,
              )}
            </span>
            <CommentControls comment={comment} setEditing={setEditing} />
          </FlexRow>
        }
        description={
          editing ? (
            <EditForm comment={comment} onFinish={() => setEditing(false)} />
          ) : (
            <Markdown
              remarkPlugins={[remarkRemoveComments, remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {comment.body}
            </Markdown>
          )
        }
      />
    </Card>
  );
}
export default memo(CommentInline);

function CommentControls({
  comment,
  setEditing,
}: {
  comment: Comment;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const currentUser = useCache(UserResource.current);
  if (!currentUser) return null;
  if (comment.user.login !== currentUser.login) return null;
  return (
    <span>
      {comment.authorAssociation !== 'NONE' ? (
        <Tag>{capFirst(comment.authorAssociation)}</Tag>
      ) : null}
      <PopControls comment={comment} setEditing={setEditing} />
    </span>
  );
}

function PopControls({
  comment,
  setEditing,
}: {
  comment: Comment;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const route = useRoutes<{ owner: string; repo: string }>()[0];
  const { fetch } = useController();

  const handleEdit = () => setEditing(true);
  const handleDelete = () =>
    fetch(CommentResource.delete, {
      owner: route.owner,
      repo: route.repo,
      id: comment.id,
    });

  return (
    <Popover
      placement="bottomLeft"
      content={
        <>
          <Button key="edit" size="small" type="text" onClick={handleEdit}>
            Edit
          </Button>
          <Button key="delete" size="small" type="text" onClick={handleDelete}>
            Delete
          </Button>
        </>
      }
      trigger="click"
    >
      <Button size="small" icon={<EllipsisOutlined />} shape="circle"></Button>
    </Popover>
  );
}

function capFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase();
}

function EditForm({
  comment,
  onFinish,
}: {
  comment: Comment;
  onFinish: () => void;
}) {
  const { fetch } = useController();
  const handleFinish = useCallback(
    ({ body }: { body: string }) => {
      return fetch(
        CommentResource.partialUpdate,
        { owner: comment.owner, repo: comment.repo, id: comment.id },
        { body },
      ).then(onFinish);
    },
    [comment.id, comment.owner, comment.repo, fetch, onFinish],
  );
  const handleCancel = onFinish;
  return (
    <CommentForm
      onFinish={handleFinish}
      label="Edit Comment"
      initialValues={comment}
      onCancel={handleCancel}
    />
  );
}
