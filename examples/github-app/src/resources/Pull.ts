import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity, githubResource } from './Base';
import { Label } from './Label';
import { stateToIcon } from './stateToIcon';
import { User } from './User';

export class Pull extends GithubEntity {
  url = '';
  htmlUrl = '';
  diffUrl = '';
  patchUrl = '';
  issueUrl = '';
  number = 0;
  state: 'open' | 'closed' | 'all' = 'open';
  locked = false;
  title = '';
  user = User.fromJS({});
  body = '';
  labels: Label[] = [];
  activeLockReason = '';
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  updatedAt = Temporal.Instant.fromEpochSeconds(0);
  closedAt: Date | null = null;
  authorAssociation = 'OWNER';
  autoMerge: null | boolean = null;
  draft = false;

  get stateIcon() {
    return stateToIcon[this.state];
  }

  get owner() {
    const pieces = this.htmlUrl.split('/');
    return pieces[pieces.length - 4];
  }

  get repo() {
    const pieces = this.htmlUrl.split('/');
    return pieces[pieces.length - 3];
  }

  static schema = {
    user: User,
    createdAt: Temporal.Instant.from,
    updatedAt: Temporal.Instant.from,
    closedAt: Temporal.Instant.from,
    labels: [Label],
  };

  static key = 'Pull';
}

export const PullResource = githubResource({
  path: '/repos/:owner/:repo/pulls/:number',
  schema: Pull,
  pollFrequency: 60000,
  searchParams: {} as PullFilters | undefined,
});
export default PullResource;

export interface PullFilters {
  state?: 'open' | 'closed' | 'all';
  page?: number | string;
}
