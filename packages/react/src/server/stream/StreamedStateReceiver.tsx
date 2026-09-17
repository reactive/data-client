'use client';
import { __INTERNAL__ } from '@data-client/core';
import type { StateDelta } from '@data-client/core';
import { useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

import type { StreamingDispatch } from './createStreamingReducer.js';
import type { SnapshotStore } from './types.js';
import useController from '../../hooks/useController.js';

const { applyStateDelta, selectBaseline, createHydrate } = __INTERNAL__;

/**
 * Folds deltas streamed after the shell into the snapshot and the live store.
 *
 * Today this runs from a layout effect. RSC may already have started the
 * island; a miss then fetches. Fold-on-script-arrival (independent of this
 * effect) and per-key waiters are not shipped. Separate snapshot and live
 * cursors so a late attach replays missed pieces once.
 *
 * flushSync and per-delta live HYDRATE are preserved HOLD behavior, not the
 * concurrent happy path.
 */
export default function StreamedStateReceiver({
  snapshotStore,
}: {
  snapshotStore: SnapshotStore;
}) {
  const controller = useController();

  useLayoutEffect(() => {
    const { queue } = snapshotStore;
    const dispatchStreamingAction =
      controller.dispatch as StreamingDispatch;
    const receive = (delta: StateDelta) => {
      const baseline = selectBaseline(snapshotStore.state, delta);
      snapshotStore.state = applyStateDelta(snapshotStore.state, delta);
      dispatchStreamingAction(createHydrate(delta, baseline));
    };
    while (snapshotStore.cursor < queue.length)
      receive(queue[snapshotStore.cursor++]);
    queue.onDelta = delta => {
      snapshotStore.cursor++;
      // Fold when this effect is attached; RSC may already have started
      // the island. Per-key waiters are not shipped. flushSync keeps live
      // store and snapshot in one task.
      flushSync(() => receive(delta));
    };
    return () => {
      queue.onDelta = undefined;
    };
  }, [controller, snapshotStore]);

  return null;
}
