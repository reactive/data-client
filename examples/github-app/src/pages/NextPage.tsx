import { useController, useLoading } from '@data-client/react';
import { Button, List, Skeleton } from 'antd';

import { IssueResource } from '@/resources/Issue';

function IssueListItemSkeleton() {
  return (
    <div style={{ paddingBottom: 16 }}>
      <List.Item>
        <Skeleton avatar title={false} active>
          <List.Item.Meta
            avatar={<Skeleton.Avatar active />}
            title={<Skeleton.Input active style={{ width: 200 }} />}
            description={<Skeleton.Input active style={{ width: 300 }} />}
          />
        </Skeleton>
      </List.Item>
    </div>
  );
}

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
      {isPending ? (
        <IssueListItemSkeleton />
      ) : (
        <Button onClick={loadMore}>Load more</Button>
      )}
    </div>
  );
}

export interface Props {
  q: string;
  page: string;
}
