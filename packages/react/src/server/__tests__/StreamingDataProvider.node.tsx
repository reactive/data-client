jest.mock(
  'next/navigation',
  () => {
    throw new Error('generic @data-client/react/ssr must not import Next');
  },
  { virtual: true },
);

import {
  actions,
  createReducer,
  Controller,
  initialState,
} from '@data-client/core';
import type { State } from '@data-client/core';
import { Endpoint, Entity } from '@data-client/endpoint';
import { useSuspense } from '@data-client/react';
import { __INTERNAL__ } from '@data-client/react/ssr';
import React, { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'stream';

const { StreamingDataProvider } = __INTERNAL__;
type SnapshotStore =
  import('@data-client/react/ssr').__INTERNAL__.SnapshotStore;
type DeltaQueue = import('@data-client/react/ssr').__INTERNAL__.DeltaQueue;

class Todo extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}
const fetchTodo = jest.fn(async ({ id }: { id: string }) => ({
  id,
  title: `todo ${id}`,
}));
const getTodo = new Endpoint(fetchTodo, { schema: Todo, name: 'getTodo' });

const reducer = createReducer(new Controller());
const seeded: State<unknown> = reducer(
  initialState,
  actions.createSetResponse(getTodo, {
    args: [{ id: '1' }],
    response: { id: '1', title: 'todo 1' },
  }),
);

function TodoView() {
  const todo = useSuspense(getTodo, { id: '1' });
  return <p>{todo.title}</p>;
}

function renderPipe(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let shellReady = false;
    const { pipe } = renderToPipeableStream(element, {
      onShellReady() {
        shellReady = true;
      },
      onAllReady() {
        const chunks: Buffer[] = [];
        const writable = new Writable({
          write(chunk, _enc, cb) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            cb();
          },
          final(cb) {
            expect(shellReady).toBe(true);
            resolve(Buffer.concat(chunks).toString('utf8'));
            cb();
          },
        });
        pipe(writable);
      },
      onError(err) {
        reject(err);
      },
    });
  });
}

describe('StreamingDataProvider', () => {
  beforeEach(() => {
    fetchTodo.mockClear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('composes through @data-client/react/ssr without Next, fetches, or a timer gate', async () => {
    const queue: DeltaQueue = Object.assign([], {});
    const snapshotStore: SnapshotStore = {
      state: seeded,
      cursor: 0,
      queue,
    };

    const html = await renderPipe(
      <html>
        <body>
          <StreamingDataProvider snapshotStore={snapshotStore} devButton={null}>
            <Suspense fallback="loading">
              <TodoView />
            </Suspense>
          </StreamingDataProvider>
        </body>
      </html>,
    );

    expect(html).toContain('<p>todo 1</p>');
    expect(fetchTodo).toHaveBeenCalledTimes(0);
  });
});
