import { actionTypes } from '@rest-hooks/core';
import type { EndpointInterface } from '@rest-hooks/endpoint';
import type { InvalidateAction } from '@rest-hooks/core';

export default function createInvalidate<E extends EndpointInterface>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): InvalidateAction {
  return {
    type: actionTypes.INVALIDATE_TYPE,
    meta: {
      key: endpoint.key(...args),
    },
  };
}
