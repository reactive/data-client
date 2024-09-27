import {
  CloudUploadOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PullRequestOutlined,
} from '@ant-design/icons';
import { schema } from '@data-client/rest';
import { Temporal } from '@js-temporal/polyfill';

import { githubResource, GithubEntity } from './Base';
import { Issue } from './Issue';
import PreviewEndpoint from './PreviewEndpoint';
import { Pull } from './Pull';
import { Push } from './Push';
import { Review } from './Review';

export class Event extends GithubEntity {
  type: EventType = 'WatchEvent';
  actor: Record<string, any> = {};
  repo: { id: number; name: string; url: string } = {} as any;
  payload: Record<string, unknown> = {};
  public = true;
  createdAt = Temporal.Instant.fromEpochSeconds(0);

  get icon() {
    return typeToIcon[this.type];
  }

  static schema = {
    createdAt: Temporal.Instant.from,
  };
}
export class PullRequestEvent extends Event {
  readonly type = 'PullRequestEvent';

  declare payload: {
    action: 'closed' | 'opened';
    number: number;
    pullRequest: Pull;
  };

  static schema = {
    ...super.schema,
    payload: { action: 'opened', number: 0, pullRequest: Pull },
  };
}
export class PullRequestReviewEvent extends Event {
  readonly type = 'PullRequestReviewEvent';
  declare payload: {
    action: 'created';
    pullRequest: Pull;
    review: Review;
  };

  static schema = {
    ...super.schema,
    payload: {
      action: 'opened',
      number: 0,
      pullRequest: Pull,
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

export const EventResource = githubResource({
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
    'type',
  ),
  Endpoint: PreviewEndpoint,
}).extend({
  getList: { path: '/users/:login/events/public\\?per_page=50' },
});

export const typeToIcon: Record<Event['type'], JSX.Element> = {
  PullRequestEvent: <PullRequestOutlined />,
  PushEvent: <CloudUploadOutlined />,
  WatchEvent: <EyeOutlined />,
  IssueCommentEvent: <CommentOutlined />,
  PullRequestReviewEvent: <EyeOutlined />,
  IssuesEvent: <ExclamationCircleOutlined />,
} as any;

type EventType =
  | 'WatchEvent'
  | 'PushEvent'
  | 'IssuesEvent'
  | 'IssueCommentEvent'
  | 'CreateEvent'
  | 'PullRequestReviewCommentEvent'
  | 'PullRequestReviewEvent'
  | 'PullRequestEvent';
