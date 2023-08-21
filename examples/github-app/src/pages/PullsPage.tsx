import { useLocationSearch } from '@anansi/router';
import { Issue } from 'resources/Issue';

import IssueList from './IssueList';

export default function PullsPage({ owner, repo }: Props) {
  const search = useLocationSearch();
  const q = search?.get('q') || 'is:pr is:open';

  return <IssueList owner={owner} repo={repo} q={q} />;
}
type Props = { owner: string; repo: string } & (
  | {
      page: number;
    }
  | {
      state?: Issue['state'];
    }
);
