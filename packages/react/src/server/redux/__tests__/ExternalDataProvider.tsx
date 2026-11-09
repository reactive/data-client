import { Controller, initialState } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import { act, render } from '@testing-library/react';
import React, { useEffect } from 'react';

import { getDefaultManagers } from '../../../components/getDefaultManagers';
import { useCache, useController } from '../../../hooks';
import ExternalDataProvider from '../ExternalDataProvider';
import { prepareStore } from '../prepareStore';

class Todo extends Entity {
  id = '';
  title = '';
}
const getTodo = new Endpoint((_args: { id: string }) => Promise.resolve({}), {
  schema: Todo,
  name: 'getTodo',
});
const updateTodo = new Endpoint(
  // never resolves, so the optimistic update stays pending
  (_args: { id: string }, _body: { title: string }) =>
    new Promise<{ id: string; title: string }>(() => undefined),
  {
    schema: Todo,
    name: 'updateTodo',
    sideEffect: true,
    getOptimisticResponse: (_snap, { id }, body) => ({ id, ...body }),
  },
);

describe('ExternalDataProvider', () => {
  const other = (state = 0, action: { type: string }) =>
    action.type === 'other' ? state + 1 : state;

  it('does not re-render when other reducers change', () => {
    let renders = 0;
    function Title() {
      const ctrl = useController();
      useEffect(() => {
        ctrl.setResponse(getTodo, { id: '1' }, { id: '1', title: 'first' });
        ctrl.fetch(updateTodo, { id: '1' }, { title: 'optimistic' });
      }, [ctrl]);
      const todo = useCache(getTodo, { id: '1' });
      renders++;
      return <>{todo?.title ?? 'empty'}</>;
    }

    const { store, selector, controller } = prepareStore(
      initialState,
      () => getDefaultManagers({ devToolsManager: null }),
      Controller,
      { other },
    );
    const { container } = render(
      <ExternalDataProvider
        store={store}
        selector={selector}
        controller={controller}
        devButton={null}
      >
        <Title />
      </ExternalDataProvider>,
    );
    expect(container.textContent).toBe('optimistic');
    expect(controller.getState().optimistic).toHaveLength(1);
    const rendersBefore = renders;

    act(() => {
      store.dispatch({ type: 'other' } as any);
    });
    expect(store.getState().other).toBe(1);
    expect(renders).toBe(rendersBefore);
  });
});
