import {
  CloudUploadOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PullRequestOutlined,
} from '@ant-design/icons';
import { schema } from '@rest-hooks/endpoint';

import { createGithubResource, GithubEntity } from './Base';
import { Issue } from './Issue';
import PreviewEndpoint from './PreviewEndpoint';
import { PullRequest } from './PullRequest';
import { Push } from './Push';
import { Repository } from './Repository';
import { Review } from './Review';
import { User } from './User';

export class Event extends GithubEntity {
  readonly type:
    | 'WatchEvent'
    | 'PushEvent'
    | 'IssuesEvent'
    | 'IssueCommentEvent'
    | 'CreateEvent'
    | 'PullRequestReviewCommentEvent'
    | 'PullRequestReviewEvent'
    | 'PullRequestEvent' = 'WatchEvent';

  readonly actor: Record<string, any> = {};
  readonly repo: { id: number; name: string; url: string } = {} as any;
  readonly payload: Record<string, any> = {};
  readonly public: boolean = true;
  readonly createdAt: Date = new Date(0);

  get icon() {
    return typeToIcon[this.type];
  }

  static schema = {
    createdAt: Date,
  };
}
export class PullRequestEvent extends Event {
  readonly type = 'PullRequestEvent';

  declare readonly payload: {
    action: 'closed' | 'opened';
    number: number;
    pullRequest: PullRequest;
  };

  static schema = {
    ...super.schema,
    payload: { action: 'opened', number: 0, pullRequest: PullRequest },
  };
}
export class PullRequestReviewEvent extends Event {
  readonly type = 'PullRequestReviewEvent';
  declare readonly payload: {
    action: 'created';
    pullRequest: PullRequest;
    review: Review;
  };

  static schema = {
    ...super.schema,
    payload: {
      action: 'opened',
      number: 0,
      pullRequest: PullRequest,
      review: Review,
    },
  };
}
export class PushEvent extends Event {
  readonly type = 'PushEvent';

  static schema = {
    ...super.schema,
    payload: Push,
  };
}
export class IssuesEvent extends Event {
  readonly type = 'IssuesEvent';

  static schema = {
    ...super.schema,
    payload: { action: 'opened', issue: Issue },
  };
}

const base = createGithubResource({
  path: '/users/:login/events/public/:id',
  schema: new schema.Union(
    {
      PullRequestEvent,
      IssuesEvent,
      PushEvent,
      PullRequestReviewEvent,
      IssueCommentEvent: Event,
      PullRequestReviewCommentEvent: Event,
      CreateEvent: Event,
      WatchEvent: Event,
      DeleteEvent: Event,
      ReleaseEvent: Event,
    },
    'type' as const,
  ),
  Endpoint: PreviewEndpoint,
});
export const EventResource = {
  ...base,
  getList: base.getList.extend({
    path: '/users/:login/events/public\\?per_page=50',
    body: undefined,
  }),
};

export const typeToIcon: Record<Event['type'], JSX.Element> = {
  PullRequestEvent: <PullRequestOutlined />,
  PushEvent: <CloudUploadOutlined />,
  WatchEvent: <EyeOutlined />,
  IssueCommentEvent: <CommentOutlined />,
  PullRequestReviewEvent: <EyeOutlined />,
  IssuesEvent: <ExclamationCircleOutlined />,
};
