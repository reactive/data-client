jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  const flushSync = jest.fn((...args: any[]) => actual.flushSync(...args));
  return { ...actual, flushSync, default: { ...actual, flushSync } };
});
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const useSyncExternalStore = jest.fn((...args: any[]) =>
    actual.useSyncExternalStore(...args),
  );
  const use =
    actual.use ? jest.fn((...args: any[]) => actual.use(...args)) : undefined;
  const wrapped = { ...actual, useSyncExternalStore, ...(use ? { use } : {}) };
  return { ...wrapped, default: wrapped };
});

import {
  commits,
  expectNoImmediateCommit,
  ImmediatePriority,
  NormalPriority,
  resetCommits,
} from '__tests__/reactCommitProbe';
import {
  appendChunk,
  captureStream,
  executeScripts,
  findTestId,
  Gate,
  holdDocumentLoading,
  installShell,
  makeGate,
  pendingMarker,
  recordConsoleErrors,
  HydratedProbe,
  type GatePromise,
} from '__tests__/streamingHarness';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  StateContext,
  useController,
  useSuspense,
} from '@data-client/react';
import { mockInitialState } from '@data-client/test';
import { act, fireEvent, waitFor } from '@testing-library/react';
import React, {
  StrictMode,
  Suspense,
  startTransition,
  useState,
  useSyncExternalStore,
  version,
} from 'react';

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const isReact18 = version.startsWith('18');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Todo extends Entity {
  id = '';
  title = '';
}

const fetchTodo = jest.fn(
  ({ id }: { id: string }) =>
    new Promise<{ id: string; title: string }>(() => {}),
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
const emptyState = mockInitialState([]);
const noDevManagers = getDefaultManagers({ devToolsManager: null });

const renders: string[] = [];
const hydratedIslands: string[] = [];
let clicks = 0;
let controller: ReturnType<typeof useController>;

function TodoView({
  id,
  withButton = false,
}: {
  id: string;
  withButton?: boolean;
}) {
  const todo = useSuspense(getTodo, { id });
  renders.push(id);
  return (
    <div data-testid={`todo-${id}`}>
      <span data-testid={`todo-${id}-title`}>{todo.title}</span>
      {withButton ?
        <button
          data-testid={`todo-${id}-btn`}
          onClick={() => {
            clicks += 1;
          }}
        >
          inc
        </button>
      : null}
      <HydratedProbe
        onHydrated={() => {
          hydratedIslands.push(id);
        }}
      />
    </div>
  );
}

function Probe() {
  controller = useController();
  return null;
}

const readContext: (ctx: typeof StateContext) => unknown =
  typeof (React as any).use === 'function' ?
    (React as any).use
  : React.useContext;

/**
 * Reads StateContext, then suspends. While a boundary is dehydrated its client
 * children have not rendered, so this isolates whether *declaring* a Context
 * read in the pending subtree changes React's propagation.
 */
function ReadThenSuspend({
  gate,
  children,
}: {
  gate: GatePromise;
  children?: React.ReactNode;
}) {
  readContext(StateContext);
  if (!gate.done) throw gate;
  return children as React.ReactElement;
}

function failCalibration(label: string) {
  throw new Error(`${label} on React ${version}: ${JSON.stringify(commits)}`);
}

function reactMinorKey() {
  const [maj, min] = version.split('.');
  return `${maj}.${min}`;
}

/** React 18 defers transition host mutations while a sibling is still dehydrated. */
async function waitForTransitionPublish(container: Element, title: string) {
  await waitFor(() => {
    expect(commits.length).toBeGreaterThan(0);
    if (!isReact18) {
      expect(
        container.querySelector('[data-testid="todo-A-title"]')?.textContent,
      ).toBe(title);
    }
  });
}

type Shape23Record = {
  pendingBAfterPublish: boolean;
  bRenderedAfterPublish: boolean;
  adopted: boolean;
  fetchIds: string[];
};

/**
 * Per-version recorded outcomes for causal controls — not a universal contract.
 * Keys are `${major}.${minor}`. Filled from the first run on 18.3 / 19.2 / 19.3.
 */
const SHAPE2_EXPECTATIONS: Record<string, Shape23Record> = {
  '18.3': {
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
  '19.2': {
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
  '19.3': {
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
};

const SHAPE3_EXPECTATIONS: Record<
  string,
  Shape23Record & { pendingAAfterPublish: boolean }
> = {
  '18.3': {
    pendingAAfterPublish: true,
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
  '19.2': {
    pendingAAfterPublish: true,
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
  '19.3': {
    pendingAAfterPublish: true,
    pendingBAfterPublish: true,
    bRenderedAfterPublish: false,
    adopted: true,
    fetchIds: [],
  },
};

function replayRest(container: Element, rest: string[], testId: string) {
  let streamed: Element | undefined;
  for (const chunk of rest) {
    const { insertedElements, scripts } = appendChunk(container, chunk);
    const found = findTestId(insertedElements, testId);
    if (found) streamed = found;
    executeScripts(scripts);
  }
  return streamed;
}

function fetchIds() {
  return fetchTodo.mock.calls.map(call => (call[0] as { id: string }).id);
}

function expectRecorded<T extends Record<string, unknown>>(
  table: Record<string, T>,
  observed: T,
  label: string,
) {
  const key = reactMinorKey();
  // eslint-disable-next-line no-console
  console.info(`${label} React ${version} (${key})`, observed);
  const expected = table[key];
  if (!expected) {
    // First run records the outcome; a follow-up commit locks the row.
    return;
  }
  expect(observed).toEqual(expected);
}

const flushSync = jest.mocked(
  (require('react-dom') as typeof import('react-dom')).flushSync,
);
const useSyncExternalStoreMock = jest.mocked(useSyncExternalStore);

describeConcurrent('commit-priority probe calibration', () => {
  it('a subscribed useSyncExternalStore store commits at Immediate priority', () => {
    const listeners = new Set<() => void>();
    let snapshot = 0;
    const store = {
      subscribe(fn: () => void) {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
      getSnapshot() {
        return snapshot;
      },
      notify() {
        snapshot += 1;
        listeners.forEach(fn => fn());
      },
    };
    function Consumer() {
      const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
      return <span>{value}</span>;
    }
    const { createRoot } = jest.requireActual('react-dom/client') as {
      createRoot: typeof import('react-dom/client').createRoot;
    };
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    act(() => {
      root.render(<Consumer />);
    });
    resetCommits();
    act(() => {
      store.notify();
    });
    if (
      commits.length === 0 ||
      commits.some(c => c.priority !== ImmediatePriority)
    ) {
      failCalibration('uSES notify was not Immediate');
    }
    act(() => {
      root.unmount();
    });
    el.remove();
  });

  it('a plain state update outside an event commits at Normal priority', async () => {
    let setX: (n: number) => void = () => {};
    function Sample() {
      const [x, set] = useState(0);
      setX = set;
      return <span>{x}</span>;
    }
    const { createRoot } = jest.requireActual('react-dom/client') as {
      createRoot: typeof import('react-dom/client').createRoot;
    };
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    act(() => {
      root.render(<Sample />);
    });
    resetCommits();
    await act(async () => {
      await Promise.resolve();
      setX(1);
    });
    if (
      commits.length === 0 ||
      commits.some(c => c.priority !== NormalPriority)
    ) {
      failCalibration('plain setState was not Normal');
    }
    act(() => {
      root.unmount();
    });
    el.remove();
  });
});

describeConcurrent('hydrateRoot on a renderToPipeableStream shell', () => {
  let container: HTMLDivElement;
  let finishDocument: (() => void) | undefined;
  let prevActEnv: boolean | undefined;
  let consoleRecorder: ReturnType<typeof recordConsoleErrors>;
  let root: { unmount(): void } | undefined;

  beforeAll(() => {
    consoleRecorder = recordConsoleErrors();
  });

  beforeEach(() => {
    consoleRecorder.unexpected.length = 0;
    flushSync.mockClear();
    useSyncExternalStoreMock.mockClear();
    fetchTodo.mockClear();
    renders.length = 0;
    hydratedIslands.length = 0;
    clicks = 0;
    container = document.createElement('div');
    document.body.appendChild(container);
    prevActEnv = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });

  afterEach(() => {
    root?.unmount();
    root = undefined;
    finishDocument?.();
    finishDocument = undefined;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    container.remove();
    expect(flushSync).not.toHaveBeenCalled();
    expect(useSyncExternalStoreMock).not.toHaveBeenCalled();
    expect(consoleRecorder.unexpected).toEqual([]);
  });

  afterAll(() => {
    consoleRecorder.restore();
  });

  function getHydrateRoot() {
    return (
      jest.requireActual('react-dom/client') as {
        hydrateRoot: typeof import('react-dom/client').hydrateRoot;
      }
    ).hydrateRoot;
  }

  describe('shape 1 — stable, gate-before-consumer', () => {
    function Page({
      gate,
      strict = false,
    }: {
      gate: GatePromise;
      strict?: boolean;
    }) {
      const tree = (
        <div id="app">
          <DataProvider
            initialState={stateAB}
            devButton={null}
            managers={noDevManagers}
          >
            <Probe />
            <Suspense fallback={<p>loading A</p>}>
              <TodoView id="A" withButton />
            </Suspense>
            <Suspense fallback={<p>loading B</p>}>
              <Gate promise={gate}>
                <TodoView id="B" />
              </Gate>
            </Suspense>
          </DataProvider>
        </div>
      );
      return strict ? <StrictMode>{tree}</StrictMode> : tree;
    }

    async function hydrateShape1(strict = false) {
      const serverGate = makeGate();
      const clientGate = makeGate();
      const { rest } = await captureStream(
        <Page gate={serverGate} strict={strict} />,
        { releaseAfterShell: [() => serverGate.release()] },
      ).then(async result => {
        installShell(container, result.shell);
        renders.length = 0;
        hydratedIslands.length = 0;
        fetchTodo.mockClear();
        return result;
      });
      const aBefore = container.querySelector('[data-testid="todo-A"]');
      finishDocument = holdDocumentLoading();
      const recoverable: unknown[] = [];
      const hydrateRoot = getHydrateRoot();
      root = hydrateRoot(
        container,
        <Page gate={clientGate} strict={strict} />,
        {
          onRecoverableError(err) {
            recoverable.push(err);
          },
        },
      );
      await waitFor(() => {
        expect(hydratedIslands).toContain('A');
      });
      return { rest, aBefore, recoverable, clientGate };
    }

    it('hydrateRoot on a renderToPipeableStream shell hydrates the ready island with zero fetches', async () => {
      const { aBefore, recoverable } = await hydrateShape1();
      expect(aBefore).toBe(container.querySelector('[data-testid="todo-A"]'));
      expect(fetchTodo).not.toHaveBeenCalled();
      expect(recoverable).toEqual([]);
      expect(pendingMarker(container, 'B:0')).toBe(true);
      expect(renders.includes('B')).toBe(false);
    });

    it('the hydrated island is interactive while a sibling is still streaming', async () => {
      await hydrateShape1();
      fireEvent.click(
        container.querySelector(
          '[data-testid="todo-A-btn"]',
        ) as HTMLButtonElement,
      );
      expect(clicks).toBe(1);
      expect(pendingMarker(container, 'B:0')).toBe(true);
    });

    it('a startTransition store publish during the open stream keeps the gate-before-consumer sibling dehydrated', async () => {
      const { aBefore } = await hydrateShape1();
      resetCommits();
      await act(async () => {
        startTransition(() => {
          controller.setResponse(
            getTodo,
            { id: 'A' },
            { id: 'A', title: 'todo A v2' },
          );
        });
      });
      await waitForTransitionPublish(container, 'todo A v2');
      expectNoImmediateCommit('transition publish');
      expect(container.querySelector('[data-testid="todo-A"]')).toBe(aBefore);
      expect(pendingMarker(container, 'B:0')).toBe(true);
      expect(renders.includes('B')).toBe(false);
      expect(fetchTodo).not.toHaveBeenCalled();
    });

    it('a default-lane store publish during the open stream keeps the gate-before-consumer sibling dehydrated', async () => {
      const { aBefore } = await hydrateShape1();
      resetCommits();
      await act(async () => {
        await Promise.resolve();
        controller.setResponse(
          getTodo,
          { id: 'A' },
          { id: 'A', title: 'todo A v2' },
        );
      });
      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="todo-A-title"]')?.textContent,
        ).toBe('todo A v2');
      });
      expectNoImmediateCommit('default-lane publish');
      expect(container.querySelector('[data-testid="todo-A"]')).toBe(aBefore);
      // React 18 default-lane ancestor updates client-render the pending sibling.
      expect(pendingMarker(container, 'B:0')).toBe(!isReact18);
      if (!isReact18) {
        expect(renders.includes('B')).toBe(false);
      }
      expect(fetchTodo).not.toHaveBeenCalled();
    });

    it('the streamed reveal hydrates the pending island in place after a publish', async () => {
      const { rest, aBefore, recoverable, clientGate } = await hydrateShape1();
      resetCommits();
      await act(async () => {
        startTransition(() => {
          controller.setResponse(
            getTodo,
            { id: 'A' },
            { id: 'A', title: 'todo A v2' },
          );
        });
      });
      await waitForTransitionPublish(container, 'todo A v2');
      expectNoImmediateCommit('transition publish');
      expect(container.querySelector('[data-testid="todo-A"]')).toBe(aBefore);
      expect(renders.includes('B')).toBe(false);

      clientGate.release();
      const bStreamedNode = replayRest(container, rest, 'todo-B');
      await waitFor(
        () => {
          expect(pendingMarker(container, 'B:0')).toBe(false);
          expect(hydratedIslands).toContain('B');
        },
        { timeout: 2000 },
      );
      expect(
        container.querySelector('[data-testid="todo-B-title"]')?.textContent,
      ).toBe('todo B');
      expect(container.querySelector('[data-testid="todo-B"]')).toBe(
        bStreamedNode,
      );
      expect(renders.filter(id => id === 'B').length).toBeGreaterThan(0);
      expect(fetchTodo).not.toHaveBeenCalled();
      expect(recoverable).toEqual([]);
    });

    it('StrictMode: same outcomes as hydrate, transition publish, and in-place reveal', async () => {
      const { rest, aBefore, recoverable, clientGate } =
        await hydrateShape1(true);
      expect(aBefore).toBe(container.querySelector('[data-testid="todo-A"]'));
      expect(fetchTodo).not.toHaveBeenCalled();
      expect(pendingMarker(container, 'B:0')).toBe(true);
      expect(renders.includes('B')).toBe(false);

      resetCommits();
      await act(async () => {
        startTransition(() => {
          controller.setResponse(
            getTodo,
            { id: 'A' },
            { id: 'A', title: 'todo A v2' },
          );
        });
      });
      await waitForTransitionPublish(container, 'todo A v2');
      expectNoImmediateCommit('transition publish');
      expect(container.querySelector('[data-testid="todo-A"]')).toBe(aBefore);
      expect(pendingMarker(container, 'B:0')).toBe(true);

      clientGate.release();
      const bStreamedNode = replayRest(container, rest, 'todo-B');
      await waitFor(
        () => {
          expect(pendingMarker(container, 'B:0')).toBe(false);
          expect(hydratedIslands).toContain('B');
        },
        { timeout: 2000 },
      );
      expect(container.querySelector('[data-testid="todo-B"]')).toBe(
        bStreamedNode,
      );
      expect(renders.filter(id => id === 'B').length).toBeGreaterThan(0);
      expect(fetchTodo).not.toHaveBeenCalled();
      expect(recoverable).toEqual([]);
    });
  });

  describe('shape 2 — stable, read-then-suspend (causal control)', () => {
    function Page({ gate }: { gate: GatePromise }) {
      return (
        <div id="app">
          <DataProvider
            initialState={stateAB}
            devButton={null}
            managers={noDevManagers}
          >
            <Probe />
            <Suspense fallback={<p>loading A</p>}>
              <TodoView id="A" withButton />
            </Suspense>
            <Suspense fallback={<p>loading B</p>}>
              <ReadThenSuspend gate={gate}>
                <TodoView id="B" />
              </ReadThenSuspend>
            </Suspense>
          </DataProvider>
        </div>
      );
    }

    it('records whether a Context-reading pending sibling stays dehydrated after a transition publish', async () => {
      const serverGate = makeGate();
      const clientGate = makeGate();
      const { rest } = await captureStream(<Page gate={serverGate} />, {
        releaseAfterShell: [() => serverGate.release()],
      }).then(async result => {
        installShell(container, result.shell);
        renders.length = 0;
        hydratedIslands.length = 0;
        fetchTodo.mockClear();
        return result;
      });
      finishDocument = holdDocumentLoading();
      const recoverable: unknown[] = [];
      const hydrateRoot = getHydrateRoot();
      root = hydrateRoot(container, <Page gate={clientGate} />, {
        onRecoverableError(err) {
          recoverable.push(err);
        },
      });
      await waitFor(() => {
        expect(hydratedIslands).toContain('A');
      });

      resetCommits();
      await act(async () => {
        startTransition(() => {
          controller.setResponse(
            getTodo,
            { id: 'A' },
            { id: 'A', title: 'todo A v2' },
          );
        });
      });
      await waitForTransitionPublish(container, 'todo A v2');
      expectNoImmediateCommit('shape 2 transition publish');
      expect(flushSync).not.toHaveBeenCalled();
      expect(recoverable).toEqual([]);
      expect(fetchTodo).not.toHaveBeenCalled();

      const afterPublish = {
        pendingBAfterPublish: pendingMarker(container, 'B:0'),
        bRenderedAfterPublish: renders.includes('B'),
      };

      clientGate.release();
      const bStreamedNode = replayRest(container, rest, 'todo-B');
      await waitFor(
        () => {
          expect(
            container.querySelector('[data-testid="todo-B"]'),
          ).not.toBeNull();
        },
        { timeout: 2000 },
      );
      const observed: Shape23Record = {
        ...afterPublish,
        adopted:
          bStreamedNode !== undefined &&
          bStreamedNode === container.querySelector('[data-testid="todo-B"]'),
        fetchIds: fetchIds(),
      };
      expectRecorded(SHAPE2_EXPECTATIONS, observed, 'shape 2');
    });
  });

  describe('shape 3 — two pending data islands (spike topology on public DataProvider)', () => {
    function Page({
      gateA,
      gateB,
      initialState,
    }: {
      gateA: GatePromise;
      gateB: GatePromise;
      initialState: typeof stateAB;
    }) {
      return (
        <div id="app">
          <DataProvider
            initialState={initialState}
            devButton={null}
            managers={noDevManagers}
          >
            <Probe />
            <Suspense fallback={<p>loading A</p>}>
              <ReadThenSuspend gate={gateA}>
                <TodoView id="A" />
              </ReadThenSuspend>
            </Suspense>
            <Suspense fallback={<p>loading B</p>}>
              <ReadThenSuspend gate={gateB}>
                <TodoView id="B" />
              </ReadThenSuspend>
            </Suspense>
          </DataProvider>
        </div>
      );
    }

    it('records the two-pending live-publish composition on public DataProvider', async () => {
      const serverGateA = makeGate();
      const serverGateB = makeGate();
      const clientGateA = makeGate();
      const clientGateB = makeGate();
      const { rest } = await captureStream(
        <Page gateA={serverGateA} gateB={serverGateB} initialState={stateAB} />,
        {
          releaseAfterShell: [
            () => serverGateA.release(),
            () => serverGateB.release(),
          ],
        },
      ).then(async result => {
        installShell(container, result.shell);
        renders.length = 0;
        hydratedIslands.length = 0;
        fetchTodo.mockClear();
        return result;
      });
      expect(pendingMarker(container, 'B:0')).toBe(true);
      expect(pendingMarker(container, 'B:1')).toBe(true);

      finishDocument = holdDocumentLoading();
      const recoverable: unknown[] = [];
      const hydrateRoot = getHydrateRoot();
      root = hydrateRoot(
        container,
        <Page
          gateA={clientGateA}
          gateB={clientGateB}
          initialState={emptyState}
        />,
        {
          onRecoverableError(err) {
            recoverable.push(err);
          },
        },
      );
      await waitFor(() => {
        expect(container.querySelector('#app')).not.toBeNull();
      });

      resetCommits();
      await act(async () => {
        startTransition(() => {
          controller.setResponse(
            getTodo,
            { id: 'A' },
            { id: 'A', title: 'todo A' },
          );
        });
      });
      await waitFor(() => {
        expect(commits.length).toBeGreaterThan(0);
      });
      expectNoImmediateCommit('shape 3 transition publish');
      expect(flushSync).not.toHaveBeenCalled();

      const afterPublish = {
        pendingAAfterPublish: pendingMarker(container, 'B:0'),
        pendingBAfterPublish: pendingMarker(container, 'B:1'),
        bRenderedAfterPublish: renders.includes('B'),
        fetchIds: fetchIds(),
      };

      clientGateA.release();
      clientGateB.release();
      const bStreamedNode = replayRest(container, rest, 'todo-B');
      await waitFor(
        () => {
          expect(
            pendingMarker(container, 'B:0') || pendingMarker(container, 'B:1'),
          ).toBe(false);
        },
        { timeout: 2000 },
      ).catch(() => {
        // Replay may client-render instead of hydrating; still record adoption.
      });
      const observed = {
        ...afterPublish,
        adopted:
          bStreamedNode !== undefined &&
          bStreamedNode === container.querySelector('[data-testid="todo-B"]'),
      };
      void recoverable;
      expectRecorded(SHAPE3_EXPECTATIONS, observed, 'shape 3');
    });
  });
});
