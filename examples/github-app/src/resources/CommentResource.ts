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

  static urlRoot =
    'https\\://api.github.com/repos/:owner/:repo/issues/:number/comments' as const;

  static schema = {
    user: UserResource,
    createdAt: Date,
    updatedAt: Date,
  };
}
