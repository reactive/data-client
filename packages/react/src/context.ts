'use client';
import { Controller, initialState } from '@data-client/core';
import type { ActionTypes, State } from '@data-client/core';
import { createContext } from 'react';
import type { Context } from 'react';

export const StateContext: Context<State<unknown>> =
  createContext(initialState);

const dispatch = (value: ActionTypes) => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'It appears you are trying to use Reactive Data Client without a provider.\nFollow instructions: https://dataclient.io/docs/getting-started/installation#add-provider-at-top-level-component',
    );
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test') {
      console.error(
        'If you are trying to test: https://dataclient.io/docs/guides/unit-testing-hooks',
      );
    }
  }
  return Promise.resolve();
};

export const ControllerContext = createContext<Controller>(
  new Controller({
    dispatch,
  }),
);

export interface ServerSnapshot {
  /**
   * State to hydrate with: what the server rendered from, falling back to
   * `live` for anything the server never sent. Returns a cached object while
   * its inputs are unchanged.
   */
  getServerSnapshot(live: State<unknown>): State<unknown>;
}
/**
 * Lets cache reads hydrate against the exact state the server rendered
 * with, even when the live store has already moved on.
 */
export const ServerSnapshotContext = createContext<ServerSnapshot | null>(null);

export interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
  uninitialized?: boolean;
}
/* istanbul ignore next */
export const StoreContext = createContext<Store<State<unknown>>>({
  subscribe: listener => () => {},
  getState: () => initialState,
  uninitialized: true,
});
