import { useController, useLoading } from '@data-client/react';
import { Button } from 'antd';

import { IssueResource } from '@/resources/Issue';

export default function NextPage({ q, page }: Props) {
  const ctrl = useController();
  const [loadMore, isPending] = useLoading(() =>
    ctrl.fetch(IssueResource.search.getPage, {
      page,
      q,
    }),
  );
  return (
    <div style={{ textAlign: 'center', marginTop: 12 }}>
      {isPending ? 'loading...' : <Button onClick={loadMore}>Load more</Button>}
    </div>
  );
}

export interface Props {
  q: string;
  page: string;
}
