import type { Manager } from '@data-client/core';

import type {
  DeltaQueue as SharedDeltaQueue,
  SnapshotStore as SharedSnapshotStore,
} from '../../stream/types.js';

/** Global array the streamed inline scripts push deltas onto */
export const DELTA_QUEUE_GLOBAL = '__DATA_CLIENT_DELTAS__';
/** Element id of the inert JSON baseline emitted with the shell */
export const BASELINE_ID = 'data-client-data';

export interface SnapshotStore extends SharedSnapshotStore {
  /** Result of the managers factory; renders React discards must not run it again */
  managers?: Manager[];
  queue: DeltaQueue;
}

export interface DeltaQueue extends SharedDeltaQueue {
  /** One fold per document, shared by every provider render */
  snapshot?: SnapshotStore;
  /** Pending wait for the baseline while the document is still loading */
  pending?: Promise<void>;
}

export function getDeltaQueue(): DeltaQueue {
  const global = globalThis as any;
  return (global[DELTA_QUEUE_GLOBAL] ??= []);
}
