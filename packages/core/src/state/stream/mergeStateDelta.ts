import type { StateBaseline, StateDelta } from './types.js';
import { writeDelta } from './writeDelta.js';
import type { State } from '../../types.js';

/**
 * Merges a streamed delta into live client state.
 *
 * A slot is taken from the delta only when the client still holds what it
 * previously received for it (`baseline`); anything the client changed since
 * wins.
 */
export function mergeStateDelta(
  state: State<unknown>,
  delta: StateDelta,
  baseline: StateBaseline,
): State<unknown> {
  return writeDelta(state, delta, baseline);
}
