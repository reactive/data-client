import { Entity, Query, Collection, unshift } from '@data-client/endpoint';
import type { PolymorphicInterface } from '@data-client/endpoint';
import { resource } from '@data-client/rest';
import { sortByTitle } from '@shared/data';
import {
  fetchIssue as serverFetchIssue,
  fetchUser as serverFetchUser,
  fetchIssueList as serverFetchIssueList,
  createIssue as serverCreateIssue,
  updateIssue as serverUpdateIssue,
  deleteIssue as serverDeleteIssue,
  updateUser as serverUpdateUser,
  deleteUser as serverDeleteUser,
} from '@shared/server';
import { User } from '@shared/types';

export class LabelEntity extends Entity {
  id = 0;
  nodeId = '';
  name = '';
  description = '';
  color = '000000';
  default = false;

  pk() {
    return `${this.id}`;
  }

  static key = 'LabelEntity';
}

export class UserEntity extends Entity {
  id = 0;
  login = '';
  nodeId = '';
  avatarUrl = '';
  gravatarId = '';
  type = 'User';
  siteAdmin = false;
  htmlUrl = '';
  name = '';
  company = '';
  blog = '';
  location = '';
  email = '';
  bio = '';
  publicRepos = 0;
  publicGists = 0;
  followers = 0;
  following = 0;
  createdAt = '';
  updatedAt = '';

  pk() {
    return this.login;
  }

  static key = 'UserEntity';
}

export class IssueEntity extends Entity {
  id = 0;
  number = 0;
  title = '';
  body = '';
  state: 'open' | 'closed' = 'open';
  locked = false;
  comments = 0;
  labels: LabelEntity[] = [];
  user = UserEntity.fromJS();
  htmlUrl = '';
  repositoryUrl = '';
  authorAssociation = 'NONE';
  createdAt = '';
  updatedAt = '';
  closedAt: string | null = null;

  pk() {
    return `${this.number}`;
  }

  static key = 'IssueEntity';
  static schema = {
    user: UserEntity,
    labels: [LabelEntity],
  };
}

class IssueCollection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [urlParams: any, body?: any],
> extends Collection<S, Parent> {
  constructor(schema: S, options?: any) {
    super(schema, options);
    (this as any).move = this.moveWith(unshift);
  }

  nonFilterArgumentKeys(key: string) {
    return key === 'count';
  }
}

export const IssueResource = resource({
  path: '/issues/:number',
  schema: IssueEntity,
  optimistic: true,
  Collection: IssueCollection,
}).extend(Base => ({
  get: Base.get.extend({
    fetch: serverFetchIssue as any,
    dataExpiryLength: Infinity,
  }),
  getList: Base.getList.extend({
    fetch: serverFetchIssueList as any,
    dataExpiryLength: Infinity,
  }),
  update: Base.update.extend({
    fetch: ((params: any, body: any) =>
      serverUpdateIssue({ ...params, ...body })) as any,
  }),
  delete: Base.delete.extend({
    fetch: serverDeleteIssue as any,
  }),
  create: Base.getList.unshift.extend({
    fetch: ((...args: any[]) =>
      serverCreateIssue(args.length > 1 ? args[1] : args[0])) as any,
    body: {} as {
      title: string;
      user: User;
    },
  }),
  move: Base.getList.move.extend({
    fetch: ((params: any, body: any) =>
      serverUpdateIssue({ ...params, ...body })) as any,
  }),
}));

export const UserResource = resource({
  path: '/users/:login',
  schema: UserEntity,
  optimistic: true,
}).extend(Base => ({
  get: Base.get.extend({
    fetch: serverFetchUser as any,
    dataExpiryLength: Infinity,
  }),
  update: Base.update.extend({
    fetch: ((params: any, body: any) =>
      serverUpdateUser({ ...params, ...body })) as any,
  }),
  delete: Base.delete.extend({
    fetch: serverDeleteUser as any,
  }),
}));

// ── DERIVED QUERIES ─────────────────────────────────────────────────────

/** Derived sorted view via Query schema -- globally memoized by MemoCache */
export const sortedIssuesQuery = new Query(
  IssueResource.getList.schema,
  (entries, { count }: { count?: number } = {}) => sortByTitle(entries, count),
);

export const sortedIssuesEndpoint = IssueResource.getList.extend({
  schema: sortedIssuesQuery,
});
