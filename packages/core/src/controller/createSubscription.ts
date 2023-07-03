import type { EndpointInterface } from '@data-client/normalizr';

import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '../actionTypes.js';
import type { SubscribeAction, UnsubscribeAction } from '../types.js';

export function createSubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): SubscribeAction<E> {
  return {
    type: SUBSCRIBE_TYPE,
    endpoint,
    meta: {
      args,
      key: endpoint.key(...args),
    },
  };
}

export function createUnsubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): UnsubscribeAction<E> {
  return {
    type: UNSUBSCRIBE_TYPE,
    endpoint,
    meta: {
      args,
      key: endpoint.key(...args),
    },
  };
}
