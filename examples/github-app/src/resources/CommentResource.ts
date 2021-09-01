import { Resource } from '@rest-hooks/rest';

import BaseResource from './BaseResource';
import UserResource from './UserResource';

export default class CommentResource extends BaseResource {
  readonly id: number | undefined = undefined;
  readonly issueUrl: string = '';
  readonly htmlUrl: string = '';
  readonly body: string = '';
  readonly user: UserResource = UserResource.fromJS({});
  readonly createdAt: Date = new Date(0);
  readonly updatedAt: Date = new Date(0);

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'https://api.github.com/repos/issues/comments';

  static url<T extends typeof Resource>(
    this: T,
    urlParams?: Readonly<any>,
  ): string {
    throw new Error('retrieving single comment not supported');
  }

  static listUrl<T extends typeof Resource>(
    this: T,
    searchParams?: Readonly<any>,
  ): string {
    if (!searchParams) throw new Error('requires searchparams');
    return `${searchParams.issueUrl}/comments`;
  }

  static schema = {
    user: UserResource,
    createdAt: Date,
    updatedAt: Date,
  };
}
