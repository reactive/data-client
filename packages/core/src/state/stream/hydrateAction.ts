import type { StateBaseline, StateDelta } from './types.js';

export const HYDRATE = 'rdc/hydrate' as const;

/** Merges state streamed from the server during SSR into the client store */
export interface HydrateAction {
  type: typeof HYDRATE;
  delta: StateDelta;
  /** What the client previously received for the slots in `delta`; slots the client changed since are left alone */
  baseline: StateBaseline;
}
