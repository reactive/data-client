import { HYDRATE } from './hydrateAction.js';
import type { HydrateAction } from './hydrateAction.js';
import type { StateBaseline, StateDelta } from './types.js';

export function createHydrate(
  delta: StateDelta,
  baseline: StateBaseline,
): HydrateAction {
  return { type: HYDRATE, delta, baseline };
}
