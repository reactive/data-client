import React from 'react';
import { useCache, useSuspense } from 'rest-hooks';
import { Card, List, Layout, Space, Timeline, Typography, Divider } from 'antd';
import { Link } from '@anansi/router';
import { UserResource, User } from 'resources/User';
import RepositoryResource, { Repository } from 'resources/Repository';
import { ForkOutlined, StarOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function UserRepositories({ user }: { user: User }) {
  const { results } = useSuspense(RepositoryResource.getByUser, {
    login: user.login,
  });
  const currentUser = useCache(UserResource.current);
  const pinned = useSuspense(
    RepositoryResource.getByPinned,
    currentUser
      ? {
          login: user.login,
        }
      : null,
  );
  let repos = pinned.user.pinnedItems.nodes ?? [];
  if (!repos.length) {
    repos = [...results.filter((repo) => !repo.fork)];
    repos.sort((a, b) => b.stargazersCount - a.stargazersCount);
    repos = repos.slice(0, 6);
  }
  return (
    <section>
      <Title level={5}>Repos</Title>
      <List
        itemLayout="horizontal"
        dataSource={repos}
        renderItem={(repo) => <RepoListItem key={repo.pk()} repo={repo} />}
      />
    </section>
  );
}

function RepoListItem({ repo }: { repo: Repository }) {
  return (
    <List.Item
      actions={[
        <IconText
          icon={StarOutlined}
          text={repo.stargazersCount}
          key="list-vertical-star-o"
        />,
        <IconText
          icon={ForkOutlined}
          text={repo.forksCount}
          key="list-vertical-like-o"
        />,
      ]}
    >
      <List.Item.Meta
        title={
          <Link
            name="IssueList"
            props={{ owner: repo.owner.login, repo: repo.name }}
          >
            {repo.name}
          </Link>
        }
        description={<>{repo.description}</>}
      />
    </List.Item>
  );
}

const IconText = ({
  icon,
  text,
}: {
  icon: React.FC;
  text: string | number;
}): JSX.Element => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);
