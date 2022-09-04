import { useState } from 'react';
import { useSuspense, useSubscription, useController } from 'rest-hooks';
import { Link, useLocation } from '@anansi/router';
import { List, Avatar } from 'antd';
import Labels from 'components/Labels';
import { Issue, IssueResource } from 'resources/Issue';

import LinkPagination from '../navigation/LinkPagination';

const REL = new Intl.RelativeTimeFormat(navigator.language || 'en-US', {
  localeMatcher: 'best fit',
  numeric: 'auto',
  style: 'long',
});

type Props = { owner: string; repo: string } & (
  | {
      page: number;
    }
  | {
      state?: Issue['state'];
    }
);

export default function IssueList({ owner, repo }: Props) {
  const location = useLocation();
  const page = Number.parseInt(
    new URLSearchParams(location && location.search.substring(1)).get('page') ||
      '1',
    10,
  );
  const params = {
    owner,
    repo,
    page,
  };
  const { results: issues, link } = useSuspense(IssueResource.getList, params);
  useSubscription(IssueResource.getList, params);

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

function NextPage({
  repo,
  owner,
  page,
}: {
  repo: string;
  owner: string;
  page: number;
}) {
  const { fetch } = useController();
  const [count, setCount] = useState(0);
  const loadMore = () => {
    fetch(IssueResource.getNextPage, { page: page + count + 1, repo, owner });
    setCount((count) => count + 1);
  };
  return (
    <div>
      <button onClick={loadMore}>Load more</button>
    </div>
  );
}

function IssueListItem({ issue }: { issue: Issue }) {
  const actions = [];
  if (issue.labels) {
    actions.push(<Labels key="labels" labels={issue.labels} />);
  }
  if (issue.comments) {
    actions.push(
      <Link
        key="comments"
        name="IssueDetail"
        props={{ number: issue.number, repo: issue.repo, owner: issue.owner }}
      >
        <span role="img" aria-label="Comments">
          🗨️
        </span>
        {issue.comments}
      </Link>,
    );
  }
  return (
    <List.Item actions={actions}>
      <List.Item.Meta
        avatar={<Avatar src={issue.user.avatarUrl} />}
        title={
          <Link
            name="IssueDetail"
            props={{
              number: issue.number,
              repo: issue.repo,
              owner: issue.owner,
            }}
          >
            {issue.stateIcon} {issue.title}
          </Link>
        }
        description={
          <>
            <a href={issue.htmlUrl} target="_blank" rel="noreferrer noopener">
              #{issue.number}
            </a>{' '}
            opened{' '}
            {REL.format(
              Math.floor((issue.createdAt.getTime() - Date.now()) / 1000 / 60),
              'minute',
            )}{' '}
            by{' '}
            <Link name="ProfileDetail" props={{ login: issue.user.login }}>
              {issue.user.login}
            </Link>
          </>
        }
      />
    </List.Item>
  );
}
