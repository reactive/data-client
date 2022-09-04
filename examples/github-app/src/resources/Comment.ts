import { GithubEntity, createGithubResource } from './Base';
import { User } from './User';

export class Comment extends GithubEntity {
  readonly issueUrl: string = '';
  readonly htmlUrl: string = '';
  readonly body: string = '';
  readonly user: User = User.fromJS({});
  readonly createdAt: Date = new Date(0);
  readonly updatedAt: Date = new Date(0);
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
    createdAt: Date,
    updatedAt: Date,
  };
}
const baseResource = createGithubResource(
  '/repos/:owner/:repo/issues/comments/:id' as const,
  Comment,
);
export const CommentResource = {
  ...baseResource,
  getList: baseResource.getList.extend({
    urlRoot: '/repos/:owner/:repo/issues/:number/comments' as const,
    body: undefined,
  }),
  create: baseResource.create.extend({
    urlRoot: '/repos/:owner/:repo/issues/:number/comments' as const,
    body: { body: '' },
    update: (newId: string, params: any) => ({
      [CommentResource.getList.key(params)]: ({
        results = [],
        ...rest
      } = {}) => ({ results: [...new Set([...results, newId])], ...rest }),
    }),
  }),
};
CommentResource.delete = baseResource.delete.extend({
  getOptimisticResponse(snap, params) {
    return params;
  },
});

export default CommentResource;
