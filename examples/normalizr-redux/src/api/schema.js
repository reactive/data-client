import { schema, Entity } from '@rest-hooks/endpoint';

class BaseEntity extends Entity {
  id = 0;

  pk() {
    return `${this.id}`;
  }
}

export class User extends BaseEntity {}

export class Commit extends BaseEntity {
  sha = '';

  static schema = {
    author: User,
    committer: User,
  };

  pk() {
    return this.sha;
  }
}

export class Label extends BaseEntity {}

export class Milestone extends BaseEntity {
  static schema = {
    creator: User,
  };
}

export class Issue extends BaseEntity {
  static schema = {
    assignee: User,
    assignees: [User],
    labels: [Label],
    milestone: Milestone,
    user: User,
  };
}

export class PullRequest extends BaseEntity {
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
