import { RestGenerics } from '@data-client/rest';

import { GithubEndpoint, GithubEntity, createGithubResource } from './Base';
import { Label } from './Label';
import { stateToIcon } from './stateToIcon';
import { User } from './User';

export class Issue extends GithubEntity {
  readonly number: number = 0;
  readonly repositoryUrl: string = '';
  readonly labelsUrl: string = '';
  readonly htmlUrl: string = '';
  readonly body: string = '';
  readonly title: string = '';
  readonly user: User = User.fromJS({});
  readonly state: 'open' | 'closed' = 'open';
  readonly locked: boolean = false;
  readonly comments: number = 0;
  readonly createdAt: Date = new Date(0);
  readonly updatedAt: Date = new Date(0);
  readonly closedAt: Date | null = null;
  readonly labels: Label[] = [];
  readonly authorAssociation: string = 'NONE';
  readonly pullRequest: Record<string, any> | null = null;
  declare readonly draft?: boolean;

  get stateIcon() {
    return stateToIcon[this.state];
  }

  get owner() {
    const pieces = this.repositoryUrl.split('/');
    return pieces[pieces.length - 2];
  }

  get repo() {
    const pieces = this.repositoryUrl.split('/');
    return pieces[pieces.length - 1];
  }

  static schema = {
    user: User,
    createdAt: Date,
    updatedAt: Date,
    closedAt: Date,
    labels: [Label],
  };

  pk() {
    return [this.repositoryUrl, this.number].join(',');
  }
}

export const BaseIssueResource = createGithubResource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
});
export const IssueResource = {
  ...BaseIssueResource,
  search: BaseIssueResource.getList.extend({
    path: '/search/issues\\?q=:q?%20repo\\::owner/:repo&page=:page?',
    schema: {
      results: {
        incompleteResults: false,
        items: BaseIssueResource.getList.schema.results,
        totalCount: 0,
      },
      link: '',
    },
  }),
};
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
