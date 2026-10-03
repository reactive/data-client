import type { HydrateAction } from './hydrateAction.js';
import { mergeStateDelta } from './mergeStateDelta.js';
import type { State } from '../../types.js';

export function hydrateReducer(
  state: State<unknown>,
  action: HydrateAction,
): State<unknown> {
  // the client reset since this baseline was captured, so the server's
  // changes describe a store the user has already discarded
  if (state.lastReset !== action.baseline.lastReset) return state;
  return mergeStateDelta(state, action.delta, action.baseline);
}
