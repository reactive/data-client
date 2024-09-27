import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity, githubResource } from './Base';
import { Label } from './Label';
import { stateToIcon } from './stateToIcon';
import { User } from './User';

export class Issue extends GithubEntity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = '';
  labelsUrl = '';
  htmlUrl = '';
  body = '';
  title = '';
  user = User.fromJS({});
  state: 'open' | 'closed' = 'open';
  locked = false;
  comments = 0;
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  updatedAt = Temporal.Instant.fromEpochSeconds(0);
  closedAt: Date | null = null;
  labels: Label[] = [];
  authorAssociation = 'NONE';
  pullRequest: Record<string, any> | null = null;
  draft?: boolean;

  get stateIcon() {
    return stateToIcon[this.state];
  }

  static schema = {
    user: User,
    createdAt: Temporal.Instant.from,
    updatedAt: Temporal.Instant.from,
    closedAt: Temporal.Instant.from,
    labels: [Label],
  };

  pk() {
    if (!this.owner) {
      const { owner, repo } = splitRepoUrl(this.repositoryUrl);
      return `${owner}/${repo}/${this.number}`;
    }
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static process(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ) {
    const { owner, repo } = splitRepoUrl(input.repositoryUrl);
    return { owner, repo, ...input };
  }
}

function splitRepoUrl(url: string) {
  const [a, b, c, d, owner, repo] = url.split('/');
  return { owner, repo };
}

export const IssueResource = githubResource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  dataExpiryLength: 60000,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
  paginationField: 'page',
}).extend((Base) => ({
  search: Base.getList.extend({
    path: '/search/issues',
    searchParams: {} as IssueFilters & { q: string },
    schema: {
      results: {
        incompleteResults: false,
        items: Base.getList.schema.results,
        totalCount: 0,
      },
      link: '',
    },
  }),
}));

export default IssueResource;

export interface IssueFilters {
  milestone?: string;
  state?: 'open' | 'closed' | 'all';
  assignee?: string;
  creator?: string;
  mentioned?: string;
  labels?: string;
  page?: number | string;
}
