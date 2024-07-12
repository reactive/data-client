import type { EndpointInterface } from '@data-client/normalizr';

import { INVALIDATE_TYPE } from '../../actionTypes.js';
import type { InvalidateAction } from '../../types.js';

export function createInvalidate<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): InvalidateAction {
  return {
    type: INVALIDATE_TYPE,
    key: endpoint.key(...args),
  };
}
