import type { State, ExpireAllAction } from '../../types.js';

export function expireReducer(state: State<unknown>, action: ExpireAllAction) {
  const meta = { ...state.meta };

  Object.keys(meta).forEach(key => {
    if (action.testKey(key)) {
      meta[key] = {
        ...meta[key],
        // 1 instead of 0 so we can do 'falsy' checks to see if it is set
        expiresAt: 1,
      };
    }
  });

  return {
    ...state,
    meta,
  };
}
