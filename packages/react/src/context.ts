'use client';
import { Controller, initialState } from '@data-client/core';
import type { ActionTypes, State } from '@data-client/core';
import { createContext } from 'react';
import type { Context, ReactElement, ReactNode } from 'react';

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

export interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
  uninitialized?: boolean;
}
/**
 * Builds the Suspense of an AsyncBoundary. Provided by a streaming SSR adapter.
 * @internal
 */
export type BoundaryWrap = (
  suspenseProps: { fallback?: ReactNode },
  content: ReactElement,
) => ReactElement;

/** @internal */
export const BoundaryContext: Context<BoundaryWrap | null> =
  createContext<BoundaryWrap | null>(null);

/* istanbul ignore next */
export const StoreContext = createContext<Store<State<unknown>>>({
  subscribe: listener => () => {},
  getState: () => initialState,
  uninitialized: true,
});
