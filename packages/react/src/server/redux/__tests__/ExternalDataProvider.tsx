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
const getTodo = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, title: 'fetched' }),
  { schema: Todo, name: 'getTodo' },
);
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

  function renderWithStore(children: React.ReactNode) {
    const { store, selector, controller } = prepareStore(
      initialState,
      () => getDefaultManagers({ devToolsManager: null }),
      Controller,
      { other },
    );
    const result = render(
      <ExternalDataProvider
        store={store}
        selector={selector}
        controller={controller}
        devButton={null}
      >
        {children}
      </ExternalDataProvider>,
    );
    return { ...result, store, controller };
  }

  it('renders dispatches from child mount Effects', () => {
    function Title() {
      const ctrl = useController();
      useEffect(() => {
        ctrl.setResponse(getTodo, { id: '1' }, { id: '1', title: 'mounted' });
      }, [ctrl]);
      return <>{useCache(getTodo, { id: '1' })?.title ?? 'empty'}</>;
    }

    const { container } = renderWithStore(<Title />);
    expect(container.textContent).toBe('mounted');
  });

  it('does not re-render when other reducers change', () => {
    const states: unknown[] = [];
    function Title() {
      const ctrl = useController();
      useEffect(() => {
        ctrl.setResponse(getTodo, { id: '1' }, { id: '1', title: 'first' });
        ctrl.fetch(updateTodo, { id: '1' }, { title: 'optimistic' });
      }, [ctrl]);
      const todo = useCache(getTodo, { id: '1' });
      states.push(todo);
      return <>{todo?.title ?? 'empty'}</>;
    }

    const { container, store, controller } = renderWithStore(<Title />);
    expect(container.textContent).toBe('optimistic');
    expect(controller.getState().optimistic).toHaveLength(1);
    const renders = states.length;

    act(() => {
      store.dispatch({ type: 'other' } as any);
    });
    expect(store.getState().other).toBe(1);
    expect(states).toHaveLength(renders);
  });
});
