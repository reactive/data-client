import { Card } from 'antd';
import { CommentResource } from 'resources/Comment';
import { useSuspense } from 'rest-hooks';

import CommentInline from './CommentInline';

export default function CommentsList({
  owner,
  repo,
  number,
}: {
  owner: string;
  repo: string;
  number: string | number;
}) {
  const { results: comments } = useSuspense(CommentResource.getList, {
    owner: owner,
    repo,
    number,
  });

  return (
    <>
      {comments.map((comment) => (
        <CommentInline key={comment.pk()} comment={comment} />
      ))}
    </>
  );
}
export function CardLoading() {
  return <Card style={{ marginTop: 16 }} loading={true} />;
}
