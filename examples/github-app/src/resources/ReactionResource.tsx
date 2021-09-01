import React from 'react';
import { Resource } from '@rest-hooks/rest';
import { HeartOutlined } from '@ant-design/icons';

import PreviewResource from './PreviewResource';
import UserResource from './UserResource';

export type ReactionType =
  | '+1'
  | '-1'
  | 'laugh'
  | 'confused'
  | 'heart'
  | 'hooray';

const Plus = (...args: any[]): any => '👍';
const Minus = (...args: any[]): any => '👎';
const Party = (...args: any[]): any => '🎉';
const Confused = (...args: any[]): any => '😕';
const Laugh = (...args: any[]): any => '😄';

const contentToIcon: Record<string, JSX.Element> = {
  '+1': <Plus />,
  '-1': <Minus />,
  laugh: <Laugh />,
  confused: <Confused />,
  heart: <HeartOutlined />,
  hooray: <Party />,
};

export default class ReactionResource extends PreviewResource {
  readonly id: number | undefined = undefined;
  readonly user: string = '';
  readonly content: ReactionType = '+1';
  readonly createdAt: Date = new Date(0);

  get contentIcon() {
    return contentToIcon[this.content];
  }

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'https://api.github.com/reactions/';

  static listUrl<T extends typeof Resource>(
    this: T,
    searchParams?: Readonly<Record<string, string | number>>,
  ): string {
    if (!searchParams) throw new Error('need search params');
    const queryParams: any = {
      ...searchParams,
    };
    delete queryParams.repositoryUrl;
    delete queryParams.number;

    const params = new URLSearchParams(queryParams as any);
    params.sort();
    return `${searchParams.repositoryUrl}/issues/${
      searchParams.number
    }/reactions?${params.toString()}`;
  }

  static schema = {
    user: UserResource,
    createdAt: Date,
  };
}
