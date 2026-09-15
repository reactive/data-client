'use client';
import { __INTERNAL__ } from '@data-client/core';
import type { StateDelta } from '@data-client/core';
import { useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

import type { SnapshotStore } from './deltaQueue.js';
import useController from '../../../hooks/useController.js';

const { applyStateDelta, selectBaseline, createHydrate } = __INTERNAL__;

/**
 * Folds deltas streamed after the shell into the snapshot and the live store.
 *
 * Intended: fold-before-useSuspense on script arrival, even if this layout
 * effect has not committed. Separate snapshot and live cursors so a late
 * attach replays missed pieces once. Stream-close is for leftover misses only.
 */
export default function StreamedStateReceiver({
  snapshotStore,
}: {
  snapshotStore: SnapshotStore;
}) {
  const controller = useController();

  useLayoutEffect(() => {
    const { queue } = snapshotStore;
    const receive = (delta: StateDelta) => {
      const baseline = selectBaseline(snapshotStore.state, delta);
      snapshotStore.state = applyStateDelta(snapshotStore.state, delta);
      controller.dispatch(createHydrate(delta, baseline));
    };
    while (snapshotStore.cursor < queue.length)
      receive(queue[snapshotStore.cursor++]);
    queue.onDelta = delta => {
      snapshotStore.cursor++;
      // Fold on script arrival; Flight may already have started the island.
      // The per-key waiter covers that race — not this effect, and not
      // DOMContentLoaded. flushSync keeps live store and snapshot in one task.
      flushSync(() => receive(delta));
    };
    return () => {
      queue.onDelta = undefined;
    };
  }, [controller, snapshotStore]);

  return null;
}
