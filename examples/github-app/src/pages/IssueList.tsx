import { useLocationSearch } from '@anansi/router';
import { useLive } from '@rest-hooks/react';
import { List } from 'antd';
import { Issue, IssueResource } from 'resources/Issue';

import IssueListItem from './IssueListItem';
import LinkPagination from '../navigation/LinkPagination';

export default function IssueList({ owner, repo }: Props) {
  const page = useLocationSearch('page') || '1';

  const { results: issues, link } = useLive(IssueResource.getList, {
    owner,
    repo,
    page,
    state: 'open',
  });

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={issues}
        renderItem={(issue) => <IssueListItem key={issue.pk()} issue={issue} />}
      />
      <div className="center">
        <LinkPagination link={link} />
      </div>
    </>
  );
}

type Props = { owner: string; repo: string } & (
  | {
      page: number;
    }
  | {
      state?: Issue['state'];
    }
);
