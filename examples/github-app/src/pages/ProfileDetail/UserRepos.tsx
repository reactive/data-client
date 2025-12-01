import { Link } from '@anansi/router';
import { ForkOutlined, StarOutlined } from '@ant-design/icons';
import { useCache, useSuspense } from '@data-client/react';
import { Table, Space, Typography } from 'antd';
import React, { type JSX } from 'react';

import RepositoryResource, { Repository } from '@/resources/Repository';
import { UserResource, User } from '@/resources/User';

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
  const columns = [
    {
      title: 'Repository',
      key: 'repository',
      render: (_: unknown, repo: Repository) => (
        <>
          <div>
            <Link
              name="IssueList"
              props={{ owner: repo.owner.login, repo: repo.name }}
            >
              {repo.name}
            </Link>
          </div>
          {repo.description && (
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '14px' }}>
              {repo.description}
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, repo: Repository) => (
        <Space style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          <IconText icon={StarOutlined} text={repo.stargazersCount} />
          <IconText icon={ForkOutlined} text={repo.forksCount} />
        </Space>
      ),
    },
  ];

  return (
    <section>
      <Title level={5}>Repos</Title>
      <Table
        dataSource={repos}
        columns={columns}
        rowKey={(repo) => repo.pk()}
        pagination={false}
        showHeader={false}
        style={{
          ['--ant-table-padding-horizontal' as string]: '0',
        }}
        components={{
          body: {
            cell: (props: any) => (
              <td
                {...props}
                style={{
                  ...props.style,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              />
            ),
          },
        }}
      />
    </section>
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
