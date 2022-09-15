import type { EndpointInterface } from '@rest-hooks/normalizr';

import type { InvalidateAction } from '../types.js';
import { INVALIDATE_TYPE } from '../actionTypes.js';

export default function createInvalidate<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): InvalidateAction {
  return {
    type: INVALIDATE_TYPE,
    meta: {
      key: endpoint.key(...args),
    },
  };
}
