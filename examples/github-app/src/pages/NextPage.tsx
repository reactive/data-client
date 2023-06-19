import { useController } from '@data-client/react';
import { useState } from 'react';
import { IssueResource } from 'resources/Issue';

export default function NextPage({
  repo,
  owner,
  page,
}: {
  repo: string;
  owner: string;
  page: number;
}) {
  const ctrl = useController();
  const [count, setCount] = useState(0);
  const loadMore = () => {
    ctrl.fetch(IssueResource.getNextPage, {
      page: page + count + 1,
      repo,
      owner,
    });
    setCount((count) => count + 1);
  };
  return (
    <div>
      <button onClick={loadMore}>Load more</button>
    </div>
  );
}
