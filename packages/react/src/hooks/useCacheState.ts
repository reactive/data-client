'use client';
import type { State } from '@data-client/core';
import React from 'react';

import use from './useUniversal.js';
import {
  ServerSnapshotContext,
  StateContext,
  StoreContext,
} from '../context.js';

const hasSyncExternalStore = Object.hasOwn(React, 'useSyncExternalStore');
const emptySubscribe = () => () => undefined;

const useCacheState: () => State<unknown> =
  /* istanbul ignore if */
  typeof window === 'undefined' && hasSyncExternalStore ?
    /* istanbul ignore next */
    () => {
      const store = use(StoreContext);
      const state = use(StateContext);
      const syncState = React.useSyncExternalStore(
        store.subscribe,
        store.getState,
        store.getState,
      );
      return store.uninitialized ? state : syncState;
    }
  : typeof document !== 'undefined' && hasSyncExternalStore ?
    () => {
      const live = use(StateContext);
      const snapshot = use(ServerSnapshotContext);
      // updates still flow through context, so transitions stay
      // non-blocking; the store hook only supplies the hydration snapshot
      const getLive = React.useCallback(() => live, [live]);
      return React.useSyncExternalStore(
        emptySubscribe,
        getLive,
        snapshot ? snapshot.getServerSnapshot : getLive,
      );
    }
  : () => use(StateContext);

export default useCacheState;
