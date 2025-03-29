import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity } from './Base';

export class Review extends GithubEntity {
  authorAssociation = 'COLLABORATOR';
  body = '';
  commitId = '';
  htmlUrl = '';

  nodeId = '';
  pullRequestUrl = '';

  state = 'approved';
  submittedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    submittedAt: Temporal.Instant.from,
  };
}
