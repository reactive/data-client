import type { StateDelta } from './types.js';
import { writeDelta } from './writeDelta.js';
import type { State } from '../../types.js';

/** Folds a streamed delta into a snapshot, taking every change */
export function applyStateDelta(
  snapshot: State<unknown>,
  delta: StateDelta,
): State<unknown> {
  return writeDelta(snapshot, delta);
}
