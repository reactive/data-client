import { Link } from '@anansi/router';
import { List, Avatar } from 'antd';
import { humanTime } from 'components/human';
import Labels from 'components/Labels';
import { Pull } from 'resources/Pull';

export default function PullListItem({ pull }: { pull: Pull }) {
  const actions = [];
  if (pull.labels) {
    actions.push(<Labels key="labels" labels={pull.labels} />);
  }
  /*if (pull.comments) {
    actions.push(
      <Link
        key="comments"
        name="IssueDetail"
        props={{ number: pull.number, repo: pull.repo, owner: pull.owner }}
      >
        <span role="img" aria-label="Comments">
          🗨️
        </span>
        {pull.comments}
      </Link>,
    );
  }*/
  return (
    <List.Item actions={actions}>
      <List.Item.Meta
        avatar={<Avatar src={pull.user.avatarUrl} />}
        title={
          <Link
            name="IssueDetail"
            props={{
              number: pull.number,
              repo: pull.repo,
              owner: pull.owner,
            }}
          >
            {pull.stateIcon} {pull.title}
          </Link>
        }
        description={
          <>
            <a href={pull.url} target="_blank" rel="noreferrer noopener">
              #{pull.number}
            </a>{' '}
            opened {humanTime(pull.createdAt)} by{' '}
            <Link name="ProfileDetail" props={{ login: pull.user.login }}>
              {pull.user.login}
            </Link>
          </>
        }
      />
    </List.Item>
  );
}
