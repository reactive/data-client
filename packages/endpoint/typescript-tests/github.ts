import { normalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import { schema, Entity } from '../src';

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
    issues: Issue,
    pullRequests: PullRequest,
  },
  (entity: any) => (entity.pull_request ? 'pullRequests' : 'issues'),
);

const data = {
  /* ...*/
};
const normalizedData = normalize(data, issueOrPullRequest);
console.log(normalizedData);
