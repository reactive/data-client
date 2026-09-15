import { __INTERNAL__ } from '@data-client/core';
import type { State } from '@data-client/core';

import { BASELINE_ID, getDeltaQueue } from './deltaQueue.js';
import type { SnapshotStore } from './deltaQueue.js';

const { applyStateDelta, initialState } = __INTERNAL__;

/**
 * Reads the server baseline and folds every delta that has streamed in so far.
 *
 * Returns once the G0 baseline is present — no wait for the first delta, the
 * last delta, or DOMContentLoaded. A document-wide DOMContentLoaded wait is
 * an acceptable interim, not a required bootstrap gate.
 *
 * Today this still suspends only when the baseline element is missing and the
 * document is still loading. Per-key waiters and fold-on-script-arrival
 * independent of StreamedStateReceiver are not shipped.
 */
export function getSnapshotStore(): SnapshotStore {
  const queue = getDeltaQueue();
  if (queue.snapshot) return queue.snapshot;
  const element = document.getElementById(BASELINE_ID);
  if (!element && document.readyState === 'loading') {
    throw (queue.pending ??= new Promise<void>(resolve => {
      // whichever fires first wins; the loser must not clobber the receiver
      // that may have been installed on `onDelta` in the meantime
      const done = () => {
        document.removeEventListener('DOMContentLoaded', done);
        if (queue.onDelta === done) queue.onDelta = undefined;
        queue.pending = undefined;
        resolve();
      };
      document.addEventListener('DOMContentLoaded', done);
      queue.onDelta = done;
    }));
  }
  let state: State<unknown> =
    element?.textContent ? JSON.parse(element.textContent) : initialState;
  for (const delta of queue) state = applyStateDelta(state, delta);
  queue.snapshot = { state, cursor: queue.length, queue };
  return queue.snapshot;
}
