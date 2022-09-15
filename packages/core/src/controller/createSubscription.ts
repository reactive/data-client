import type { EndpointInterface } from '@rest-hooks/normalizr';

import type { SubscribeAction, UnsubscribeAction } from '../types.js';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '../actionTypes.js';

export function createSubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): SubscribeAction {
  return {
    type: SUBSCRIBE_TYPE,
    endpoint,
    meta: {
      args,
      key: endpoint.key(...args),
      fetch: () => endpoint(...args),
      schema: endpoint.schema,
      options: endpoint,
    },
  };
}
/** Future action shape
{
  type: SUBSCRIBE_TYPE,
  endpoint,
  meta: {
    args,
  },
} */

export function createUnsubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): UnsubscribeAction {
  return {
    type: UNSUBSCRIBE_TYPE,
    endpoint,
    meta: {
      args,
      key: endpoint.key(...args),
      options: endpoint,
    },
  };
}
/** Future action shape
{
  type: UNSUBSCRIBE_TYPE,
  endpoint,
  meta: {
    args,
  },
} */
