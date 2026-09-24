'use client';
import React, { useRef, useCallback, useEffect, useLayoutEffect } from 'react';

import type { ReducerAction } from './ReducerAction.js';

type PromiseHolder = { promise: Promise<void>; resolve: () => void };

/** Turns a dispatch function into one that resolves once its been commited */
export default function usePromisifiedDispatch<
  R extends React.Reducer<any, any>,
>(dispatch: React.Dispatch<ReducerAction<R>>, state: React.ReducerState<R>) {
  const dispatchPromiseRef = useRef<null | PromiseHolder>(null);
  // Actions that arrive before the first commit. null once that commit's
  // layout effect has run, which is also how this stays distinct from the
  // post-unmount no-op installed by useEnhancedReducer.
  const preCommitQueueRef = useRef<ReducerAction<R>[] | null>([]);
  // Mount snapshot the flushed actions must not resolve against. The passive
  // effect below runs for that snapshot too, and resolving there lets
  // listeners read state before the reducer applies the response.
  const awaitCommitFromRef = useRef<React.ReducerState<R> | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    const queued = preCommitQueueRef.current;
    if (queued === null) return;
    preCommitQueueRef.current = null;
    if (queued.length === 0) return;
    awaitCommitFromRef.current = state;
    for (let i = 0; i < queued.length; i++) {
      dispatch(queued[i]);
    }
    // `state` is the snapshot these actions must commit past. Re-running this
    // when it changes would flush an already-open gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (
      awaitCommitFromRef.current !== undefined &&
      state === awaitCommitFromRef.current
    ) {
      return;
    }
    awaitCommitFromRef.current = undefined;
    // Layout effect has not opened the gate yet (SSR, or a host that runs
    // passive effects first). Keep the commit promise pending.
    if (
      preCommitQueueRef.current !== null &&
      preCommitQueueRef.current.length > 0
    ) {
      return;
    }
    if (dispatchPromiseRef.current) {
      dispatchPromiseRef.current.resolve();
      dispatchPromiseRef.current = null;
    }
  }, [state]);

  return useCallback(
    (action: ReducerAction<R>) => {
      if (!dispatchPromiseRef.current) {
        dispatchPromiseRef.current = NewPromiseHolder();
      }
      // we use the promise before dispatch so we know it will be resolved
      // however that can also make the ref clear, so we need to make sure we have to promise before
      // dispatching so we can return it even if the ref changes.
      const promise = dispatchPromiseRef.current.promise;
      const queued = preCommitQueueRef.current;
      if (queued !== null) {
        queued.push(action);
        return promise;
      }
      dispatch(action);
      return promise;
    },
    [dispatch],
  );
}

function NewPromiseHolder(): PromiseHolder {
  // any so we can build it
  const promiseHolder: any = {};
  promiseHolder.promise = new Promise(resolve => {
    promiseHolder.resolve = resolve;
  });
  return promiseHolder;
}
