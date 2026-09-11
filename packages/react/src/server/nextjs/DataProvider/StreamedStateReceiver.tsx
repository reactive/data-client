'use client';
import { __INTERNAL__ } from '@data-client/core';
import type { StateDelta } from '@data-client/core';
import { useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

import type { SnapshotStore } from './snapshotStore.js';
import useController from '../../../hooks/useController.js';

const { applyStateDelta, selectBaseline, createHydrate } = __INTERNAL__;

/** Folds deltas streamed after the shell into the snapshot and the live store */
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
      // the boundary this delta precedes hydrates as soon as its own script
      // runs; the live store must already agree with the snapshot by then
      flushSync(() => receive(delta));
    };
    return () => {
      queue.onDelta = undefined;
    };
  }, [controller, snapshotStore]);

  return null;
}
