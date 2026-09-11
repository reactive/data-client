import { __INTERNAL__ } from '@data-client/core';
import type { State } from '@data-client/core';

import { BASELINE_ID, getDeltaQueue } from './deltaQueue.js';
import type { DeltaQueue } from './deltaQueue.js';

const { applyStateDelta, initialState } = __INTERNAL__;

export interface SnapshotStore {
  /** Fold of everything the server has sent: what the HTML being hydrated was rendered from */
  state: State<unknown>;
  /** Number of queued deltas already folded into `state` */
  cursor: number;
  queue: DeltaQueue;
}

let snapshotStore: SnapshotStore | undefined;
let pendingBaseline: Promise<void> | undefined;

/**
 * Reads the server baseline and folds every delta that has streamed in so far.
 *
 * One per document: the server emits a single baseline element. Throws a
 * promise (suspends) while the document is still loading and the baseline
 * has not been parsed yet.
 */
export function getSnapshotStore(): SnapshotStore {
  if (snapshotStore) return snapshotStore;
  const queue = getDeltaQueue();
  const element = document.getElementById(BASELINE_ID);
  if (!element && document.readyState === 'loading') {
    throw (pendingBaseline ??= new Promise<void>(resolve => {
      const done = () => {
        queue.onDelta = undefined;
        resolve();
      };
      document.addEventListener('DOMContentLoaded', done, { once: true });
      queue.onDelta = done;
    }));
  }
  let state: State<unknown> =
    element?.textContent ? JSON.parse(element.textContent) : initialState;
  for (const delta of queue) state = applyStateDelta(state, delta);
  snapshotStore = { state, cursor: queue.length, queue };
  return snapshotStore;
}
