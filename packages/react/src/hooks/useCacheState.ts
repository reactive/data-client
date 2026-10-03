'use client';
import type { State } from '@data-client/core';
import React from 'react';

import use from './useUniversal.js';
import { StateContext, StoreContext } from '../context.js';

const hasSyncExternalStore = Object.hasOwn(React, 'useSyncExternalStore');

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
  : () => use(StateContext);

export default useCacheState;
