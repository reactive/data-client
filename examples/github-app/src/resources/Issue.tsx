import { InfoCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import { RestGenerics } from '@rest-hooks/rest';
import React from 'react';

import { GithubEndpoint, GithubEntity, createGithubResource } from './Base';
import { Label } from './Label';
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

export const IssueResource = createGithubResource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
});
export default IssueResource;

const stateToIcon: Record<string, React.ReactNode> = {
  closed: <IssuesCloseOutlined />,
  open: <InfoCircleOutlined />,
};

export interface IssueFilters {
  milestone?: string;
  state?: 'open' | 'closed' | 'all';
  assignee?: string;
  creator?: string;
  mentioned?: string;
  labels?: string;
  page?: number | string;
}
