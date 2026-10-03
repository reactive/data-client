import { GCPolicy } from '@data-client/core';
import { DataProvider, useController, useSuspense } from '@data-client/react';
import { act, render } from '@testing-library/react';
import { makeGetTodo, mockTodoState, Todo } from '__tests__/concurrentFixtures';
import React, { Suspense, useLayoutEffect, useState } from 'react';

/** Characterization of today's GC timing, not a statement of desired
 * behavior.
 *
 * Read hooks increment GC refs in a passive effect. A sweep that runs after
 * a consumer commits but before that effect sees a zero count and queues
 * deletion. The reducer does not consult counts, so the entity is deleted
 * while the consumer is mounted. GC returns the same state object, so the
 * consumer keeps rendering stale data until an unrelated update, then
 * suspends and refetches.
 *
 * The sweep runs in a sibling layout effect to land deterministically in
 * that window. In an app it would be an idle callback that fires between a
 * non-sync commit and React's scheduled passive-effect flush.
 *
 * See plans/gc-handoff.md, decision 3 ("How is 'still referenced' known").
 */
class SweepableGCPolicy extends GCPolicy {
  sweep() {
    this.runSweep();
  }
}

describe('GC sweep between consumer commit and countRef', () => {
  it('deletes a mounted consumer entity, which later suspends and refetches', async () => {
    const fetchTodo = jest.fn(async ({ id }: { id: string }) => ({
      id,
      title: `fetched ${id}`,
    }));
    const getTodo = makeGetTodo(fetchTodo);
    const gcPolicy = new SweepableGCPolicy({ expiresAt: () => 0 });
    let sweepOnLayout = false;
    let setShow!: (show: boolean) => void;
    let controller!: ReturnType<typeof useController>;

    function TodoTitle() {
      const todo = useSuspense(getTodo, { id: '1' });
      return <div>{todo.title}</div>;
    }
    function SweepInLayout() {
      useLayoutEffect(() => {
        if (sweepOnLayout) gcPolicy.sweep();
      }, []);
      return null;
    }
    function App() {
      const [show, set] = useState(true);
      setShow = set;
      controller = useController();
      return show ?
          <>
            <TodoTitle />
            <SweepInLayout />
          </>
        : null;
    }

    const { container } = render(
      <DataProvider
        initialState={mockTodoState(getTodo, ['1'])}
        gcPolicy={gcPolicy}
      >
        <Suspense fallback="loading">
          <App />
        </Suspense>
      </DataProvider>,
    );
    expect(container.textContent).toBe('todo 1');

    // unmount queues Todo 1 and its endpoint for collection
    act(() => setShow(false));

    act(() => {
      sweepOnLayout = true;
      setShow(true);
    });

    // consumer is mounted and counted, but its entity is gone
    expect(container.textContent).toBe('todo 1');
    expect(gcPolicy['entityCount'].get(Todo.key)?.get('1')).toBe(1);
    expect(controller.getState().entities[Todo.key]?.['1']).toBeUndefined();
    expect(fetchTodo).not.toHaveBeenCalled();

    // any unrelated update exposes the deletion to the mounted consumer
    await act(async () => {
      controller.setResponse(getTodo, { id: '2' }, { id: '2', title: 'two' });
    });
    expect(fetchTodo).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('fetched 1');
  });
});
