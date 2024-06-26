import { normalize } from '@data-client/normalizr';

import Controller from '../../controller/Controller.js';
import type { State, SetAction } from '../../types.js';

export function setReducer(
  state: State<unknown>,
  action: SetAction,
  controller: Controller,
) {
  let value: any;
  if (typeof action.value === 'function') {
    const previousValue = controller.get(
      action.schema,
      ...action.meta.args,
      state,
    );
    if (previousValue === undefined) return state;
    value = action.value(previousValue);
  } else {
    value = action.value;
  }
  try {
    const { entities, indexes, entityMeta } = normalize(
      action.schema,
      value,
      action.meta,
      state,
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
