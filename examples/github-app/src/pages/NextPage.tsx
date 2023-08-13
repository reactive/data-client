import { useLoading } from '@data-client/hooks';
import { useController } from '@data-client/react';
import { Button } from 'antd';
import { IssueResource } from 'resources/Issue';

export default function NextPage({
  repo,
  owner,
  q,
  page,
}: {
  repo: string;
  owner: string;
  q: string;
  page: string;
}) {
  const ctrl = useController();
  const [loadMore, loading] = useLoading(async () => {
    await ctrl.fetch(IssueResource.search.getPage, {
      page,
      repo,
      owner,
      q,
    });
  });
  return (
    <div style={{ textAlign: 'center' }}>
      {loading ? 'loading...' : <Button onClick={loadMore}>Load more</Button>}
    </div>
  );
}
