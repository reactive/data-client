import React from 'react';
import { useSuspense, useSubscription } from 'rest-hooks';
import { Link, useLocation } from '@anansi/router';
import { List, Avatar } from 'antd';

import LinkPagination from '../navigation/LinkPagination';
import IssueResource from '../resources/IssueResource';

const REL = new Intl.RelativeTimeFormat(navigator.language || 'en-US', {
  localeMatcher: 'best fit',
  numeric: 'auto',
  style: 'long',
});

type Props = Pick<IssueResource, 'repositoryUrl'> &
  (
    | {
        page: number;
      }
    | {
        state?: IssueResource['state'];
      }
  );

export default function IssueList({ repositoryUrl }: Props) {
  const location = useLocation();
  const page = Number.parseInt(
    new URLSearchParams(location && location.search.substring(1)).get('page') ||
      '1',
    10,
  );
  const { results: issues, link } = useSuspense(IssueResource.list(), {
    repositoryUrl,
    page,
  });
  useSubscription(IssueResource.list(), {
    repositoryUrl,
    page,
  });

  return (
    <React.Fragment>
      <List
        itemLayout="horizontal"
        dataSource={issues}
        renderItem={(issue) => <IssueListItem key={issue.pk()} issue={issue} />}
      />
      <div className="center">
        <LinkPagination link={link} />
      </div>
    </React.Fragment>
  );
}

function IssueListItem({ issue }: { issue: IssueResource }) {
  const actions = [];
  if (issue.comments) {
    actions.push(
      <Link name="IssueDetail" props={{ number: issue.number }}>
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
          <Link name="IssueDetail" props={{ number: issue.number }}>
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
