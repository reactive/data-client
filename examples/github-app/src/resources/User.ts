import { Temporal } from '@js-temporal/polyfill';

import { githubResource, GithubEndpoint, GithubEntity } from './Base';

export class User extends GithubEntity {
  nodeId = '';
  login = '';
  avatarUrl = '';
  gravatarUrl = '';
  gravatarId = '';
  type = 'User';
  siteAdmin = false;
  htmlUrl = '';
  followersUrl = '';
  followingUrl = '';
  gistsUrl = '';
  starredUrl = '';
  subscriptionsUrl = '';
  organizationsUrl = '';
  eventsUrl = '';
  receivedEventsUrl = '';

  name = '';
  company = '';
  blog = '';
  location = '';
  email = '';
  hireable = false;
  bio = '';
  publicRepos = 0;
  publicGists = 0;
  followers = 0;
  following = 0;
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);
  privateGists = 0;
  totalPrivateRepos = 0;
  ownedPrivateRepos = 0;
  collaborators = 0;

  static schema = {
    createdAt: Temporal.Instant.from,
    updatedAt: Temporal.Instant.from,
  };

  pk() {
    return this.login;
  }
}
export const UserResource = githubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});

export default UserResource;
