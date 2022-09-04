import { GithubEntity } from './Base';
import { User } from './User';

export class PullRequest extends GithubEntity {
  readonly user: User = User.fromJS({});
  readonly title: string = '';
  readonly body: string = '';
  readonly draft: boolean = false;
  readonly createdAt: Date = new Date(0);

  static schema = {
    user: User,
    createdAt: Date,
  };
}
