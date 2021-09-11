import type { InvalidateAction } from '@rest-hooks/core/types';
import { INVALIDATE_TYPE } from '@rest-hooks/core/actionTypes';
import type { EndpointInterface } from '@rest-hooks/endpoint';

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
