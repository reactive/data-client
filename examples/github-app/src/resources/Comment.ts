import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity, createGithubResource } from './Base';
import { User } from './User';

export class Comment extends GithubEntity {
  readonly issueUrl: string = '';
  readonly htmlUrl: string = '';
  readonly body: string = '';
  readonly user: User = User.fromJS();
  readonly createdAt = Temporal.Instant.fromEpochSeconds(0);
  readonly updatedAt = Temporal.Instant.fromEpochSeconds(0);
  readonly authorAssociation: string = 'NONE';

  get owner() {
    const pieces = this.issueUrl.split('/issues')[0].split('/');
    return pieces[pieces.length - 2];
  }

  get repo() {
    const pieces = this.issueUrl.split('/issues')[0].split('/');
    return pieces[pieces.length - 1];
  }

  static schema = {
    user: User,
    createdAt: Temporal.Instant.from,
    updatedAt: Temporal.Instant.from,
  };
}
export const CommentResource = createGithubResource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
  optimistic: true,
}).extend({
  getList: {
    path: '/repos/:owner/:repo/issues/:number/comments',
    body: { body: '' },
  },
});
export default CommentResource;
