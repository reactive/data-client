import { useLocationSearch } from '@anansi/router';
import { Issue } from 'resources/Issue';

import IssueList from './IssueList';

export default function PullsPage({ owner, repo }: Props) {
  const search = useLocationSearch();
  const query = `${search?.get('query') || 'is:open'} is:pr`;

  return <IssueList owner={owner} repo={repo} query={query} />;
}
type Props = { owner: string; repo: string } & {
  state?: Issue['state'];
};
