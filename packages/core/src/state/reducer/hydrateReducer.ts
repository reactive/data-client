import type { HydrateAction, State } from '../../types.js';
import { mergeStateDelta } from '../stream/mergeStateDelta.js';

export function hydrateReducer(
  state: State<unknown>,
  action: HydrateAction,
): State<unknown> {
  // the client reset since this baseline was captured, so the server's
  // changes describe a store the user has already discarded
  if (state.lastReset !== action.baseline.lastReset) return state;
  return mergeStateDelta(state, action.delta, action.baseline);
}
