import { normalize } from '@data-client/normalizr';

import type { State, SetAction } from '../../types.js';

export function setReducer(state: State<unknown>, action: SetAction) {
  try {
    const { entities, indexes, entityMeta } = normalize(
      action.value,
      action.schema,
      action.meta.args as any,
      state.entities,
      state.indexes,
      state.entityMeta,
      action.meta,
    );
    return {
      entities,
      indexes,
      endpoints: state.endpoints,
      entityMeta,
      meta: state.meta,
      optimistic: state.optimistic,
      lastReset: state.lastReset,
    };
    // reducer must update the state, so in case of processing errors we simply compute the endpoints inline
  } catch (error: any) {
    // this is not always bubbled up, so let's double sure this doesn't fail silently
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    return state;
  }
}
