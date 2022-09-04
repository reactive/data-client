import { RestGenerics } from '@rest-hooks/experimental';
import React from 'react';
import { InfoCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';

import { User } from './User';
import { Label } from './Label';
import { GithubEndpoint, GithubEntity, createGithubResource } from './Base';

const stateToIcon: Record<string, React.ReactNode> = {
  closed: <IssuesCloseOutlined />,
  open: <InfoCircleOutlined />,
};

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
  readonly closedAt: string | null = null;
  readonly labels: Label[] = [];
  readonly authorAssociation: string = 'NONE';
  readonly pullRequest: Record<string, any> | null = null;

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
    labels: [Label],
  };

  pk() {
    return [this.repositoryUrl, this.number].join(',');
  }
}
// since we don't use for types - setting generics is not essential
class IssueEndpoint<O extends RestGenerics = any> extends GithubEndpoint<O> {
  pollFrequency = 60000;
}

export const IssueResource = createGithubResource(
  '/repos/:owner/:repo/issues/:number' as const,
  Issue,
  IssueEndpoint,
);
export default IssueResource;
