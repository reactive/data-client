import { INVALIDATE_TYPE } from '../../actionTypes.js';
import type {
  State,
  InvalidateAllAction,
  InvalidateAction,
} from '../../types.js';

export function invalidateReducer(
  state: State<unknown>,
  action: InvalidateAction | InvalidateAllAction,
) {
  const endpoints = { ...state.endpoints };
  const meta = { ...state.meta };
  const invalidateKey = (key: string) => {
    delete endpoints[key];
    const itemMeta = {
      ...meta[key],
      expiresAt: 0,
      invalidated: true,
    };
    delete itemMeta.error;
    meta[key] = itemMeta;
  };
  if (action.type === INVALIDATE_TYPE) {
    invalidateKey(action.key);
  } else {
    Object.keys(endpoints).forEach(key => {
      if (action.testKey(key)) {
        invalidateKey(key);
      }
    });
  }

  return {
    ...state,
    endpoints,
    meta,
  };
}
