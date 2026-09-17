import {
  Controller,
  __INTERNAL__,
  actions,
  createReducer,
  initialState,
} from '@data-client/core';
import type { State, StateDelta } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import { act, render } from '@testing-library/react';
import React from 'react';

import DataProviderBase from '../../../components/DataProviderBase';
import useCache from '../../../hooks/useCache';
import createStreamingReducer from '../createStreamingReducer';
import StreamedStateReceiver from '../StreamedStateReceiver';
import type { DeltaQueue, SnapshotStore } from '../types';

const { diffState } = __INTERNAL__;

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

const reducer = createReducer(new Controller());
const setTodo = (state: State<unknown>, id: string) =>
  reducer(
    state,
    actions.createSetResponse(getTodo, {
      args: [{ id }],
      response: { id, title: `todo ${id}` },
    }),
  );
const transport = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function Probe({ id }: { id: string }) {
  const todo = useCache(getTodo, { id });
  return <span data-id={id}>{todo?.title ?? 'none'}</span>;
}

describe('StreamedStateReceiver', () => {
  const s0 = initialState;
  const s1 = setTodo(s0, '0');
  const s2 = setTodo(s1, '1');
  const delta1 = transport(diffState(s0, s1)!);
  const delta2 = transport(diffState(s1, s2)!);

  function makeStore(queued: StateDelta[] = []): SnapshotStore {
    const queue: DeltaQueue = Object.assign([...queued], {});
    return { state: s0, cursor: 0, queue };
  }

  it('replays queued deltas on attach', () => {
    const snapshotStore = makeStore([delta1, delta2]);
    const { getByText } = render(
      <DataProviderBase
        reducerFactory={createStreamingReducer}
        initialState={s0}
        devButton={null}
      >
        <StreamedStateReceiver snapshotStore={snapshotStore} />
        <Probe id="1" />
      </DataProviderBase>,
    );
    expect(getByText('todo 1')).toBeDefined();
    expect(snapshotStore.cursor).toBe(2);
    expect(snapshotStore.state.entities.Todo).toHaveProperty('1');
  });

  it('folds live deltas through onDelta and clears on unmount', () => {
    const snapshotStore = makeStore();
    const { getByText, unmount } = render(
      <DataProviderBase
        reducerFactory={createStreamingReducer}
        initialState={s0}
        devButton={null}
      >
        <StreamedStateReceiver snapshotStore={snapshotStore} />
        <Probe id="1" />
      </DataProviderBase>,
    );
    expect(getByText('none')).toBeDefined();
    act(() => {
      snapshotStore.queue.push(delta1);
      snapshotStore.queue.onDelta?.(delta1);
      snapshotStore.queue.push(delta2);
      snapshotStore.queue.onDelta?.(delta2);
    });
    expect(getByText('todo 1')).toBeDefined();
    expect(snapshotStore.cursor).toBe(2);
    const receiver = snapshotStore.queue.onDelta;
    expect(receiver).toBeDefined();
    unmount();
    expect(snapshotStore.queue.onDelta).toBeUndefined();
    expect(receiver).not.toBe(snapshotStore.queue.onDelta);
  });
});
