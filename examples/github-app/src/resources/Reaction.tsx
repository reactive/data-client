import { HeartOutlined } from '@ant-design/icons';
import { Temporal } from '@js-temporal/polyfill';

import { githubResource, GithubEntity } from './Base';
import PreviewEndpoint from './PreviewEndpoint';
import { User } from './User';

export class Reaction extends GithubEntity {
  user = User.fromJS();
  content: ReactionType = '+1';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  get contentIcon() {
    return contentToIcon[this.content];
  }

  static schema = {
    user: User,
    createdAt: Temporal.Instant.from,
  };
}

export const ReactionResource = githubResource({
  path: '/repos/:owner/:repo/issues/:number/reactions/:id',
  schema: Reaction,
  Endpoint: PreviewEndpoint,
  optimistic: true,
}).extend((base) => ({
  getByComment: base.getList.extend({
    path: 'repos/:owner/:repo/issues/comments/:comment/reactions',
  }),
}));

export default ReactionResource;

export type ReactionType =
  | '+1'
  | '-1'
  | 'laugh'
  | 'confused'
  | 'heart'
  | 'hooray'
  | 'eyes'
  | 'rocket';

const Plus = (...args: any[]): any => '👍';
const Minus = (...args: any[]): any => '👎';
const Party = (...args: any[]): any => '🎉';
const Confused = (...args: any[]): any => '😕';
const Laugh = (...args: any[]): any => '😄';
const Rocket = (...args: any[]): any => '🚀';
const Eyes = (...args: any[]): any => '👀';

export const contentToIcon = {
  '+1': <Plus />,
  '-1': <Minus />,
  laugh: <Laugh />,
  confused: <Confused />,
  heart: <HeartOutlined />,
  hooray: <Party />,
  rocket: <Rocket />,
  eyes: <Eyes />,
} as const;
