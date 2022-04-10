import React from 'react';
import { useSuspense } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import Markdown from 'react-markdown';
import { Link } from '@anansi/router';

import CommentResource from '../../resources/CommentResource';

const { Meta } = Card;

export default function CommentsList({
  owner,
  repo,
  number,
}: {
  owner: string;
  repo: string;
  number: string | number;
}) {
  const { results: comments } = useSuspense(CommentResource.list(), {
    owner,
    repo,
    number,
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
        avatar={
          <Link name="ProfileDetail" props={{ login: comment.user.login }}>
            <Avatar src={comment.user.avatarUrl} />
          </Link>
        }
        title={
          <React.Fragment>
            <Link name="ProfileDetail" props={{ login: comment.user.login }}>
              {comment.user.login}
            </Link>{' '}
            commented on{' '}
            {new Intl.DateTimeFormat(navigator.language).format(
              comment.createdAt,
            )}
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
