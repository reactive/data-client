import React from 'react';
import { useResource } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import Markdown from 'react-markdown';
import moment from 'moment';

import CommentResource from '../../resources/CommentResource';

const { Meta } = Card;

export default function CommentsList({ issueUrl }: { issueUrl: string }) {
  const { results: comments } = useResource(CommentResource.list(), {
    issueUrl,
  });

  return (
    <React.Fragment>
      {comments.map((comment) => (
        <CommentInline key={comment.pk()} comment={comment} />
      ))}
    </React.Fragment>
  );
}

function CommentInline({ comment }: { comment: CommentResource }) {
  return (
    <Card style={{ marginTop: 16 }}>
      <Meta
        avatar={<Avatar src={comment.user.avatarUrl} />}
        title={
          <React.Fragment>
            <a
              href={comment.user.htmlUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {comment.user.login}
            </a>{' '}
            commented on {moment(comment.createdAt).format('MMM Do YYYY')}
          </React.Fragment>
        }
        description={<Markdown>{comment.body}</Markdown>}
      />
    </Card>
  );
}

export function CardLoading() {
  return <Card style={{ marginTop: 16 }} loading={true} />;
}
