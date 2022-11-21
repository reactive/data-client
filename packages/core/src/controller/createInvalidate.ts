import type { EndpointInterface } from '@rest-hooks/normalizr';

import { INVALIDATE_TYPE } from '../actionTypes.js';
import type { InvalidateAction } from '../newActions.js';

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
