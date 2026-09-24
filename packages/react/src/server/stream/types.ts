import type { State, StateDelta } from '@data-client/core';

/**
 * Queue of streamed store pieces. Adapter transports may extend this
 * with host-specific fields; the shared receiver only uses `onDelta`.
 */
export interface DeltaQueue extends Array<StateDelta> {
  onDelta?: (delta: StateDelta) => void;
}

/**
 * Adapter-owned snapshot of everything the server has sent so far.
 *
 * `state` is the snapshot the HTML was rendered from. `cursor` is how far
 * the live receiver has replayed; a late attach replays the rest once.
 */
export interface SnapshotStore {
  state: State<unknown>;
  cursor: number;
  queue: DeltaQueue;
}
