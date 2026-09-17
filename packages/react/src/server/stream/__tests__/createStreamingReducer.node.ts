import {
  Controller,
  __INTERNAL__,
  actions,
  createReducer,
  initialState,
} from '@data-client/core';
import type { ActionTypes, State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';

import createStreamingReducer from '../createStreamingReducer';
import type {
  StreamingDispatch,
  StreamingReducer,
} from '../createStreamingReducer';

const { createHydrate, HYDRATE, selectBaseline, diffState } = __INTERNAL__;

class Todo extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}
const getTodo = new Endpoint(
  async ({ id }: { id: string }) => ({ id, title: `todo ${id}` }),
  { schema: Todo, name: 'getTodo' },
);

const transport = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe('createStreamingReducer', () => {
  const controller = new Controller();
  const master = createReducer(controller);
  const streaming = createStreamingReducer(controller);
  const setTodo = (state: State<unknown>, id: string) =>
    master(
      state,
      actions.createSetResponse(getTodo, {
        args: [{ id }],
        response: { id, title: `todo ${id}` },
      }),
    );
  const s1 = setTodo(initialState, '0');
  const s2 = setTodo(s1, '1');
  const delta = transport(diffState(s1, s2)!);
  const hydrate = createHydrate(delta, selectBaseline(s1, delta));

  it('applies HYDRATE through hydrateReducer', () => {
    expect(hydrate.type).toBe(HYDRATE);
    const next = streaming(s1, hydrate);
    expect(next.entities.Todo).toHaveProperty('1');
    expect(next.entities.Todo!['0']).toBe(s1.entities.Todo!['0']);
  });

  it('forwards committed actions to the master reducer', () => {
    const next = streaming(
      initialState,
      actions.createSetResponse(getTodo, {
        args: [{ id: '0' }],
        response: { id: '0', title: 'todo 0' },
      }),
    );
    expect(next.entities.Todo!['0']).toEqual(
      master(
        initialState,
        actions.createSetResponse(getTodo, {
          args: [{ id: '0' }],
          response: { id: '0', title: 'todo 0' },
        }),
      ).entities.Todo!['0'],
    );
  });

  it('rejects HydrateAction on the public Controller and master reducer', () => {
    function typeTests() {
      // @ts-expect-error public Controller.dispatch rejects HydrateAction
      controller.dispatch(hydrate);
      // @ts-expect-error MasterReducer rejects HydrateAction
      master(s1, hydrate);
    }
    expect(typeof typeTests).toBe('function');
  });

  it('accepts HydrateAction on StreamingDispatch and StreamingReducer', () => {
    const dispatchStreaming: StreamingDispatch = async () => {};
    const streamingReducer: StreamingReducer = streaming;
    void dispatchStreaming(hydrate);
    streamingReducer(s1, hydrate);
    const set: ActionTypes = actions.createReset();
    void dispatchStreaming(set);
    streamingReducer(s1, set);
  });
});
