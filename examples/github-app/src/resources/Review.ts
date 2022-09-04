import { GithubEntity } from './Base';

export class Review extends GithubEntity {
  authorAssociation = 'COLLABORATOR';
  body = '';
  commitId = '';
  htmlUrl = '';

  nodeId = '';
  pullRequestUrl = '';

  state = 'approved';
  submittedAt = new Date(0);

  static schema = {
    submittedAt: Date,
  };
}
