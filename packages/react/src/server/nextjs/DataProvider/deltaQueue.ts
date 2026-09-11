import type { State, StateDelta } from '@data-client/core';

/** Global array the streamed inline scripts push deltas onto */
export const DELTA_QUEUE_GLOBAL = '__DATA_CLIENT_DELTAS__';
/** Element id of the inert JSON baseline emitted with the shell */
export const BASELINE_ID = 'data-client-data';

export interface SnapshotStore {
  /** Fold of everything the server has sent: what the HTML being hydrated was rendered from */
  state: State<unknown>;
  /** Number of queued deltas already folded into `state` */
  cursor: number;
  queue: DeltaQueue;
}

export interface DeltaQueue extends Array<StateDelta> {
  /** Installed once the provider mounts so later deltas apply immediately */
  onDelta?: (delta: StateDelta) => void;
  /** One fold per document, shared by every provider render */
  snapshot?: SnapshotStore;
  /** Pending wait for the baseline while the document is still loading */
  pending?: Promise<void>;
}

export function getDeltaQueue(): DeltaQueue {
  const global = globalThis as any;
  return (global[DELTA_QUEUE_GLOBAL] ??= []);
}
