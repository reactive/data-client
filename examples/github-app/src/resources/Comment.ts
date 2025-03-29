import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity, githubResource } from './Base';
import { User } from './User';

export class Comment extends GithubEntity {
  issueUrl = '';
  htmlUrl = '';
  body = '';
  user = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);
  authorAssociation = 'NONE';

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
export const CommentResource = githubResource({
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
