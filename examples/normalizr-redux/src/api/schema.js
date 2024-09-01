import { schema, Entity } from '@data-client/endpoint';

export class User extends Entity {}

export class Commit extends Entity {
  sha = '';

  static schema = {
    author: User,
    committer: User,
  };

  pk() {
    return this.sha;
  }
}

export class Label extends Entity {}

export class Milestone extends Entity {
  static schema = {
    creator: User,
  };
}

export class Issue extends Entity {
  static schema = {
    assignee: User,
    assignees: [User],
    labels: [Label],
    milestone: Milestone,
    user: User,
  };
}

export class PullRequest extends Entity {
  static schema = {
    assignee: User,
    assignees: [User],
    labels: [Label],
    milestone: Milestone,
    user: User,
  };
}

export const IssueOrPullRequest = new schema.Array(
  {
    issues: Issue,
    pullRequests: PullRequest,
  },
  entity => (entity.pull_request ? 'pullRequests' : 'issues'),
);
