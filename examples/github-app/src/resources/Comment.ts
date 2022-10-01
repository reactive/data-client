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
const baseResource = createGithubResource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
});
const getList = baseResource.getList.extend({
  path: '/repos/:owner/:repo/issues/:number/comments',
  body: undefined,
});
const create = baseResource.create.extend({
  path: '/repos/:owner/:repo/issues/:number/comments',
  body: { body: '' },
  update: (newId: string, params: any) => ({
    [getList.key(params)]: ({ results = [], ...rest } = {}) => ({
      results: [...new Set([...results, newId])],
      ...rest,
    }),
  }),
});
export const CommentResource = {
  ...baseResource,
  getList,
  create,
  delete: baseResource.delete.extend({
    getOptimisticResponse(snap, params) {
      return params;
    },
  }),
};

export default CommentResource;
