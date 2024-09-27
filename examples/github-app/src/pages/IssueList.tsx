import { useSuspense } from '@data-client/react';
import { List } from 'antd';
import parseLink from 'parse-link-header';
import { memo } from 'react';

import { Issue, IssueResource } from '@/resources/Issue';

import IssueListItem from './IssueListItem';
import NextPage from './NextPage';

function IssueList({ owner, repo, query = '' }: Props) {
  const q = `${query} repo:${owner}/${repo}`;
  const {
    results: { items: issues },
    link,
  } = useSuspense(IssueResource.search, { q });
  const nextPage = parseLink(link)?.next?.page;

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={issues}
        renderItem={(issue) => <IssueListItem key={issue.pk()} issue={issue} />}
        loadMore={nextPage ? <NextPage q={q} page={nextPage} /> : null}
      />
    </>
  );
}

export default memo(IssueList);

type Props = { owner: string; repo: string; query?: string } & {
  state?: Issue['state'];
};
