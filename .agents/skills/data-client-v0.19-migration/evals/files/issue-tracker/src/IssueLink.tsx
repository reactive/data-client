import { useController } from '@data-client/react';

import { IssueResource } from './resources';

export function IssueLink({ id, title }: { id: number; title: string }) {
  const ctrl = useController();
  return (
    <a
      href={`/issues/${id}`}
      onMouseEnter={() => {
        ctrl.fetchIfStale(IssueResource.get, { id });
      }}
    >
      {title}
    </a>
  );
}
