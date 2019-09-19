import React from 'react';
import { ActionTypes } from '~/types';
import { initialState } from '~/state/reducer';

export const StateContext = React.createContext(initialState);

export const DispatchContext = React.createContext((value: ActionTypes) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'It appears you are trying to use Rest Hooks without a provider.\nFollow instructions: https://resthooks.io/docs/getting-started/installation#add-provider-at-top-level-component',
    );
    if (process.env.NODE_ENV === 'test') {
      console.error(
        'If you are trying to test: https://resthooks.io/docs/guides/unit-testing-hooks',
      );
    }
  }
  return Promise.resolve();
});
