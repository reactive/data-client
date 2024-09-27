import { useSuspense } from '@data-client/react';
import { Card } from 'antd';

import { CommentResource } from '@/resources/Comment';

import CommentInline from './CommentInline';

export default function CommentsList({ owner, repo, number }: Props) {
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
interface Props {
  owner: string;
  repo: string;
  number: string | number;
}
