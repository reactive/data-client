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

  it('replaceReducer() and [Symbol.observable]() throw', () => {
    const { store } = makeStore();
    expect(() => store.replaceReducer(state => state!)).toThrow(
      'not supported',
    );
    // redux keys it by '@@observable' when Symbol.observable isn't polyfilled
    expect(() => (store as any)[Symbol.observable ?? '@@observable']()).toThrow(
      'not supported',
    );
  });
});
