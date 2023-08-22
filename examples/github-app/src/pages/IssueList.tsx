import { useSuspense } from '@data-client/react';
import { List } from 'antd';
import parseLink from 'parse-link-header';
import { Issue, IssueResource } from 'resources/Issue';

import IssueListItem from './IssueListItem';
import NextPage from './NextPage';

export default function IssueList({ owner, repo, q }: Props) {
  const {
    results: { items: issues },
    link,
  } = useSuspense(IssueResource.search, { owner, repo, q });
  const nextPage = parseLink(link)?.next?.page;

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={issues}
        renderItem={(issue) => <IssueListItem key={issue.pk()} issue={issue} />}
        loadMore={
          nextPage ? (
            <NextPage owner={owner} repo={repo} q={q} page={nextPage} />
          ) : null
        }
      />
    </>
  );
}

type Props = { owner: string; repo: string; q: string } & {
  state?: Issue['state'];
};
