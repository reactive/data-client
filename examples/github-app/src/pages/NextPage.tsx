import { useLoading } from '@data-client/hooks';
import { useController } from '@data-client/react';
import { Button } from 'antd';
import { useState } from 'react';
import { IssueResource } from 'resources/Issue';

export default function NextPage({
  repo,
  owner,
  q,
}: {
  repo: string;
  owner: string;
  q: string;
}) {
  const ctrl = useController();
  const [count, setCount] = useState(1);
  const [loadMore, loading] = useLoading(async () => {
    await ctrl.fetch(IssueResource.search.getPage, {
      page: (count + 1).toString(),
      repo,
      owner,
      q,
    });
    setCount((count) => count + 1);
  });
  return (
    <div style={{ textAlign: 'center' }}>
      {loading ? 'loading...' : <Button onClick={loadMore}>Load more</Button>}
    </div>
  );
}
