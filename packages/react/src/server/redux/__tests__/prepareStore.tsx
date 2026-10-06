import { Controller, initialState } from '@data-client/core';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider, useSelector } from 'react-redux';

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

  // react-redux 9 needs React 18's useSyncExternalStore
  const itReact18 = Number(React.version.split('.')[0]) >= 18 ? it : it.skip;

  itReact18('returns a redux Store that react-redux <Provider> accepts', () => {
    const { store, selector, controller } = makeStore();
    let seen: string[] | undefined;
    function Todos() {
      seen = useSelector((state: { todos: string[] }) => state.todos);
      return null;
    }

    render(
      <ExternalDataProvider
        store={store}
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
    // redux keys it by '@@observable' when Symbol.observable isn't polyfilled
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
