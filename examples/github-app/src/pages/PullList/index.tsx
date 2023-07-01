import { useLocationSearch } from '@anansi/router';
import { useLive } from '@rest-hooks/react';
import { List } from 'antd';
import { Pull, PullResource } from 'resources/Pull';

import PullListItem from './PullListItem';
import LinkPagination from '../../navigation/LinkPagination';

export default function PullList({ owner, repo }: Props) {
  const page = useLocationSearch('page') || '1';

  const { results: pulls, link } = useLive(PullResource.getList, {
    owner,
    repo,
    page,
    state: 'open',
  });

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={pulls}
        renderItem={(pull) => <PullListItem key={pull.pk()} pull={pull} />}
      />
      <div className="center">
        <LinkPagination link={link} />
      </div>
    </>
  );
}

type Props = { owner: string; repo: string } & (
  | {
      page: number;
    }
  | {
      state?: Pull['state'];
    }
);
