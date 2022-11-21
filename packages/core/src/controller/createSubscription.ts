import type { EndpointInterface } from '@rest-hooks/normalizr';

import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '../actionTypes.js';
import type {
  CompatibleSubscribeAction,
  CompatibleUnsubscribeAction,
} from '../compatibleActions.js';

export function createSubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): CompatibleSubscribeAction<E> {
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

export function createUnsubscription<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): CompatibleUnsubscribeAction<E> {
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
