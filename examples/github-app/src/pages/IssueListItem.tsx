import { Link } from '@anansi/router';
import { List, Avatar } from 'antd';
import { humanTime } from 'components/human';
import Labels from 'components/Labels';
import { Issue } from 'resources/Issue';

export default function IssueListItem({ issue }: { issue: Issue }) {
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
            opened {humanTime(issue.createdAt)} by{' '}
            <Link name="ProfileDetail" props={{ login: issue.user.login }}>
              {issue.user.login}
            </Link>
          </>
        }
      />
    </List.Item>
  );
}
