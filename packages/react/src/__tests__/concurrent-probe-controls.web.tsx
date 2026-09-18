/* eslint-disable import/order -- reactCommitProbe must precede react-dom/client */
import {
  expectAllCommitsPriority,
  ImmediatePriority,
  makeNotifyStore,
  NormalPriority,
  resetCommits,
} from '__tests__/reactCommitProbe';
import {
  captureStream,
  Gate,
  getHydrateRoot,
  holdDocumentLoading,
  installShell,
  makeGate,
  pendingMarker,
  recordConsoleErrors,
  replayRest,
} from '__tests__/streamingHarness';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  useController,
  useSuspense,
} from '@data-client/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { mockInitialState } from '@data-client/test';
import React, {
  startTransition,
  Suspense,
  useState,
  useSyncExternalStore,
  version,
} from 'react';
/* eslint-enable import/order */

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Todo extends Entity {
  id = '';
  title = '';
}

const fetchTodo = jest.fn(({ id }: { id: string }) =>
  Promise.resolve({ id, title: `todo ${id}` }),
);
const getTodo = new Endpoint(fetchTodo, { schema: Todo, name: 'getTodo' });

const stateAB = mockInitialState([
  {
    endpoint: getTodo,
    args: [{ id: 'A' }],
    response: { id: 'A', title: 'todo A' },
  },
  {
    endpoint: getTodo,
    args: [{ id: 'B' }],
    response: { id: 'B', title: 'todo B' },
  },
]);

function TodoView({ id }: { id: string }) {
  const todo = useSuspense(getTodo, { id });
  return <div data-testid={`todo-${id}`}>{todo.title}</div>;
}

describeConcurrent('concurrent probe controls', () => {
  let consoleRecorder: ReturnType<typeof recordConsoleErrors>;

  beforeAll(() => {
    consoleRecorder = recordConsoleErrors();
  });

  beforeEach(() => {
    consoleRecorder.unexpected.length = 0;
    resetCommits();
    fetchTodo.mockClear();
  });

  afterEach(() => {
    expect(consoleRecorder.unexpected).toEqual([]);
  });

  afterAll(() => {
    consoleRecorder.restore();
  });

  it('a subscribed useSyncExternalStore store commits at Immediate priority, even inside startTransition', () => {
    const store = makeNotifyStore();
    function Consumer() {
      const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
      return <span data-testid="uses-value">{value}</span>;
    }
    const { getByTestId } = render(<Consumer />);
    resetCommits();
    act(() => {
      store.notify();
    });
    expect(getByTestId('uses-value').textContent).toBe('1');
    expectAllCommitsPriority(
      'uSES notify was not Immediate',
      ImmediatePriority,
    );

    resetCommits();
    act(() => {
      startTransition(() => {
        store.notify();
      });
    });
    expect(getByTestId('uses-value').textContent).toBe('2');
    expectAllCommitsPriority(
      'uSES notify inside startTransition was not Immediate',
      ImmediatePriority,
    );
  });

  it('a plain state update outside an event commits at Normal priority', async () => {
    let setX: (n: number) => void = () => {};
    function Sample() {
      const [x, set] = useState(0);
      setX = set;
      return <span data-testid="x">{x}</span>;
    }
    render(<Sample />);
    resetCommits();
    await act(async () => {
      await Promise.resolve();
      setX(1);
    });
    expect(document.querySelector('[data-testid="x"]')?.textContent).toBe('1');
    expectAllCommitsPriority('plain setState was not Normal', NormalPriority);
  });

  it('a store publish from a discrete click handler is Immediate by React design', () => {
    function ClickPublish() {
      const controller = useController();
      return (
        <button
          onClick={() =>
            controller.setResponse(
              getTodo,
              { id: 'A' },
              {
                id: 'A',
                title: 'todo A v2',
              },
            )
          }
        >
          publish
        </button>
      );
    }
    const { getByText, getByTestId } = render(
      <DataProvider
        initialState={stateAB}
        devButton={null}
        managers={getDefaultManagers({ devToolsManager: null })}
      >
        <Suspense fallback={<p>loading A</p>}>
          <TodoView id="A" />
        </Suspense>
        <ClickPublish />
      </DataProvider>,
    );
    resetCommits();
    act(() => {
      fireEvent.click(getByText('publish'));
    });
    expect(getByTestId('todo-A').textContent).toBe('todo A v2');
    expectAllCommitsPriority(
      'discrete setResponse was not Immediate',
      ImmediatePriority,
    );
  });

  describe('recreating Suspense elements above a pending boundary', () => {
    let container: HTMLDivElement;
    let finishDocument: (() => void) | undefined;
    let prevActEnv: boolean | undefined;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      prevActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
      (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    });

    afterEach(() => {
      finishDocument?.();
      finishDocument = undefined;
      (globalThis as any).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
      container.remove();
    });

    it('client-renders the pending sibling so the streamed node is not adopted', async () => {
      const serverGate = makeGate();
      const clientGate = makeGate();
      let bump = () => {};

      function RecreatingTree({ gate }: { gate: ReturnType<typeof makeGate> }) {
        const [tick, setTick] = useState(0);
        bump = () => setTick(t => t + 1);
        return (
          <>
            <button data-testid="bump" onClick={() => setTick(t => t + 1)}>
              bump {tick}
            </button>
            <Suspense fallback={<p>loading A</p>}>
              <TodoView id="A" />
            </Suspense>
            <Suspense fallback={<p>loading B</p>}>
              <Gate promise={gate}>
                <TodoView id="B" />
              </Gate>
            </Suspense>
          </>
        );
      }

      function Page({ gate }: { gate: ReturnType<typeof makeGate> }) {
        return (
          <div id="app">
            <DataProvider initialState={stateAB} devButton={null}>
              <RecreatingTree gate={gate} />
            </DataProvider>
          </div>
        );
      }

      const { shell, rest } = await captureStream(<Page gate={serverGate} />, {
        releaseAfterShell: [() => serverGate.release()],
      });
      installShell(container, shell);
      finishDocument = holdDocumentLoading();
      const root = getHydrateRoot()(container, <Page gate={clientGate} />);
      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="todo-A"]'),
        ).not.toBeNull();
      });
      expect(pendingMarker(container, 'B:0')).toBe(true);

      act(() => {
        bump();
      });
      await waitFor(() => {
        expect(pendingMarker(container, 'B:0')).toBe(false);
      });
      expect(container.textContent).toContain('loading B');

      const bStreamedNode = replayRest(container, rest, 'todo-B');
      expect(bStreamedNode).toBeDefined();
      const visibleB = container.querySelector('[data-testid="todo-B"]');
      expect(visibleB === bStreamedNode).toBe(false);

      root.unmount();
    });
  });
});
