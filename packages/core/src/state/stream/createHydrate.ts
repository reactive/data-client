import type { StateBaseline, StateDelta } from './types.js';
import { HYDRATE } from '../../actionTypes.js';
import type { HydrateAction } from '../../types.js';

export function createHydrate(
  delta: StateDelta,
  baseline: StateBaseline,
): HydrateAction {
  return { type: HYDRATE, delta, baseline };
}
