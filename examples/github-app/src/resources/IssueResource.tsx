import {
  EndpointExtraOptions,
  Resource,
  RestEndpoint,
  RestFetch,
} from '@rest-hooks/rest';
import React from 'react';
import { InfoCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';

import BaseResource from './BaseResource';
import UserResource from './UserResource';

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

  get stateIcon() {
    return stateToIcon[this.state];
  }

  static schema = {
    user: UserResource,
    createdAt: Date,
    updatedAt: Date,
  };

  pk() {
    return [this.repositoryUrl, this.number].join(',');
  }

  static urlRoot = 'https://api.github.com/repos/issues';

  static getEndpointExtra(): EndpointExtraOptions {
    return { ...super.getEndpointExtra(), pollFrequency: 60000 };
  }

  static url(urlParams: Readonly<any>): string {
    if (urlParams) {
      return `${urlParams.repositoryUrl}/issues/${urlParams.number}`;
    }
    return this.urlRoot;
  }

  static listUrl(
    searchParams: Readonly<Record<string, string | number>>,
  ): string {
    const queryParams: any = {
      ...searchParams,
      per_page: 50,
    };
    delete queryParams.repositoryUrl;

    const params = new URLSearchParams(queryParams);
    params.sort();
    return `${searchParams.repositoryUrl}/issues?${params.toString()}`;
  }

  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    RestFetch<{ repositoryUrl: string; state?: string }>,
    { results: T[]; link: string },
    undefined
  > {
    return super.list() as any;
  }
}
