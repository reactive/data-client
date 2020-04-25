import { normalize, schema, Entity } from '../src';
import IDEntity from '../src/entities/IDEntity';

class User extends IDEntity {}

class Label extends IDEntity {}

class Milestone extends IDEntity {
  static schema = { creator: User };
}

class Issue extends IDEntity {
  static schema = {
    assignee: User,
    assignees: [User],
    labels: Label,
    milestone: Milestone,
    user: User,
  };
}

class PullRequest extends IDEntity {
  static schema = {
    assignee: User,
    assignees: [User],
    labels: Label,
    milestone: Milestone,
    user: User,
  };
}

const issueOrPullRequest = new schema.Array(
  {
    issues: Issue.asSchema(),
    pullRequests: PullRequest.asSchema(),
  },
  (entity: any) => (entity.pull_request ? 'pullRequests' : 'issues'),
);

const data = {
  /* ...*/
};
const normalizedData = normalize(data, issueOrPullRequest);
console.log(normalizedData);
