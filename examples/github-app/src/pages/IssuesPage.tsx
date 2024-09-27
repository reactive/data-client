import { Link, useLocationSearch } from '@anansi/router';
import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import { Issue } from 'resources/Issue';

import IssueList from './IssueList';

export default function IssuePage({ owner, repo }: Props) {
  const search = useLocationSearch();
  const query = `${search?.get('query') || 'is:open'} is:issue`;

  return (
    <>
      <Breadcrumb
        itemRender={(route, params, routes, paths) =>
          route.href ? <Link name="Home">{route.title}</Link> : route.title
        }
        items={[
          {
            href: '/',
            title: <HomeOutlined />,
          },
          {
            title: (
              <>
                <span>{owner}</span>
              </>
            ),
          },
          {
            title: (
              <>
                <span>{repo}</span>
              </>
            ),
          },
          {
            title: 'Issues',
          },
        ]}
      />
      <IssueList owner={owner} repo={repo} query={query} />
    </>
  );
}
type Props = { owner: string; repo: string } & {
  state?: Issue['state'];
};
