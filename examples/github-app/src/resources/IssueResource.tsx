import { EndpointExtraOptions } from '@rest-hooks/experimental';
import React from 'react';
import { InfoCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';

import BaseResource from './BaseResource';
import UserResource from './UserResource';
import LabelResource from './LabelResource';

const stateToIcon: Record<string, React.ReactNode> = {
  closed: <IssuesCloseOutlined />,
  open: <InfoCircleOutlined />,
};

export default class IssueResource extends BaseResource {
  readonly id: number | undefined = undefined;
  readonly number: number = 0;
  readonly repositoryUrl: string = '';
  readonly labelsUrl: string = '';
  readonly htmlUrl: string = '';
  readonly body: string = '';
  readonly title: string = '';
  readonly user: UserResource = UserResource.fromJS({});
  readonly state: 'open' | 'closed' = 'open';
  readonly locked: boolean = false;
  readonly comments: number = 0;
  readonly createdAt: Date = new Date(0);
  readonly updatedAt: Date = new Date(0);
  readonly closedAt: string | null = null;
  readonly labels: LabelResource[] = [];

  get stateIcon() {
    return stateToIcon[this.state];
  }

  static schema = {
    user: UserResource,
    createdAt: Date,
    updatedAt: Date,
    labels: [LabelResource],
  };

  pk() {
    return [this.repositoryUrl, this.number].join(',');
  }

  static urlRoot =
    'https\\://api.github.com/repos/:owner/:repo/issues/:number?' as const;

  static getEndpointExtra(): EndpointExtraOptions {
    return { ...super.getEndpointExtra(), pollFrequency: 60000 };
  }
}
