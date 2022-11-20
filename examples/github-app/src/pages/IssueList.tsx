import { useLocation } from '@anansi/router';
import { useLive } from '@rest-hooks/react';
import { List } from 'antd';
import { Issue, IssueResource } from 'resources/Issue';

import LinkPagination from '../navigation/LinkPagination';
import IssueListItem from './IssueListItem';

export default function IssueList({ owner, repo }: Props) {
  const location = useLocation();
  const page = Number.parseInt(
    new URLSearchParams(location?.search?.substring?.(1)).get('page') || '1',
    10,
  );
  const params = {
    owner,
    repo,
    page,
  };
  const { results: issues, link } = useLive(IssueResource.getList, params);

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
