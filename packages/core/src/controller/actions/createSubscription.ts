import type { EndpointInterface } from '@data-client/normalizr';

import { SUBSCRIBE, UNSUBSCRIBE } from '../../actionTypes.js';
import type { SubscribeAction, UnsubscribeAction } from '../../types.js';

export function createSubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): SubscribeAction<E> {
  return {
    type: SUBSCRIBE,
    key: endpoint.key(...args),
    args,
    endpoint,
  };
}

export function createUnsubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): UnsubscribeAction<E> {
  return {
    type: UNSUBSCRIBE,
    key: endpoint.key(...args),
    args,
    endpoint,
  };
}
