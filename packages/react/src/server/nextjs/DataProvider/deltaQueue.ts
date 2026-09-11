import type { StateDelta } from '@data-client/core';

/** Global array the streamed inline scripts push deltas onto */
export const DELTA_QUEUE_GLOBAL = '__DATA_CLIENT_DELTAS__';
/** Element id of the inert JSON baseline emitted with the shell */
export const BASELINE_ID = 'data-client-data';

export interface DeltaQueue extends Array<StateDelta> {
  /** Installed once the provider mounts so later deltas apply immediately */
  onDelta?: (delta: StateDelta) => void;
}

export function getDeltaQueue(): DeltaQueue {
  const global = globalThis as any;
  return (global[DELTA_QUEUE_GLOBAL] ??= []);
}
