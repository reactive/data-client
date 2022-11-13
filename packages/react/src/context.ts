import { Controller, initialState } from '@rest-hooks/core';
import type { ActionTypes, State, DenormalizeCache } from '@rest-hooks/core';
import { createContext, type Context } from 'react';

export const StateContext: Context<State<unknown>> =
  createContext(initialState);

const dispatch = (value: ActionTypes) => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'It appears you are trying to use Rest Hooks without a provider.\nFollow instructions: https://resthooks.io/docs/getting-started/installation#add-provider-at-top-level-component',
    );
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test') {
      console.error(
        'If you are trying to test: https://resthooks.io/docs/guides/unit-testing-hooks',
      );
    }
  }
  return Promise.resolve();
};
export const DispatchContext = createContext(dispatch);

// this is not needed anymore, but keeping around for backcompatibility
export const DenormalizeCacheContext = createContext<DenormalizeCache>({
  entities: {},
  results: {},
});

export const ControllerContext = createContext<Controller>(
  new Controller({
    dispatch,
    globalCache: {
      entities: {},
      results: {},
    },
  }),
);

export interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
  uninitialized?: boolean;
}
/* istanbul ignore next */
export const StoreContext = createContext<Store<State<unknown>>>({
  subscribe: listener => () => {},
  dispatch: () => {},
  getState: () => initialState,
  uninitialized: true,
});
