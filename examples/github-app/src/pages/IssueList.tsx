import { useLive } from '@rest-hooks/react';
import { List } from 'antd';
import { Issue, IssueResource } from 'resources/Issue';

import IssueListItem from './IssueListItem';
import LinkPagination from '../navigation/LinkPagination';

export default function IssueList({ owner, repo, page, q }: Props) {
  const {
    results: { items: issues },
    link,
  } = useLive(IssueResource.search, {
    owner,
    repo,
    page,
    q,
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

type Props = { owner: string; repo: string; page: string; q: string } & {
  state?: Issue['state'];
};
