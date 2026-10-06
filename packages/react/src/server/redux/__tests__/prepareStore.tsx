import { Controller, initialState } from '@data-client/core';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider, useSelector } from 'react-redux';
import type { Store } from 'redux';

import { getDefaultManagers } from '../../../components/getDefaultManagers';
import ExternalDataProvider from '../ExternalDataProvider';
import { prepareStore } from '../prepareStore';

describe('prepareStore()', () => {
  const todos = (state: string[] = ['first'], action: { type: string }) =>
    action.type === 'add' ? [...state, 'added'] : state;

  function makeStore() {
    return prepareStore(initialState, getDefaultManagers(), Controller, {
      todos,
    });
  }

  it('returns a redux Store that react-redux <Provider> accepts', () => {
    const { store, selector, controller } = makeStore();
    // compile-time check: assignable to redux's own Store type
    const reduxStore: Store<ReturnType<typeof store.getState>> = store;
    let seen: string[] | undefined;
    function Todos() {
      seen = useSelector((state: { todos: string[] }) => state.todos);
      return null;
    }

    render(
      <ExternalDataProvider
        store={reduxStore}
        selector={selector}
        controller={controller}
        devButton={null}
      >
        <Provider store={store}>
          <Todos />
        </Provider>
      </ExternalDataProvider>,
    );
    expect(seen).toEqual(['first']);
  });

  it('replaceReducer() swaps the reducer', () => {
    const { store } = makeStore();
    store.replaceReducer(state => ({ ...state!, todos: ['replaced'] }));
    expect(store.getState().todos).toEqual(['replaced']);
  });

  it('[Symbol.observable]() emits state', () => {
    const { store } = makeStore();
    // redux falls back to this key when Symbol.observable isn't polyfilled
    const observable = (store as any)[Symbol.observable ?? '@@observable']();
    const next = jest.fn();
    const { unsubscribe } = observable.subscribe({ next });
    expect(next).toHaveBeenLastCalledWith(store.getState());
    store.dispatch({ type: 'add' });
    expect(next).toHaveBeenLastCalledWith(
      expect.objectContaining({ todos: ['first', 'added'] }),
    );
    unsubscribe();
    store.dispatch({ type: 'add' });
    expect(next).toHaveBeenCalledTimes(2);
  });
});
