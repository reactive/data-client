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
  expectOnlyNormalCommits,
  ImmediatePriority,
  NormalPriority,
  resetCommits,
} from '__tests__/reactCommitProbe';
import { recordConsoleErrors } from '__tests__/streamingHarness';
import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  useCache,
  useController,
  useLive,
  useSuspense,
} from '@data-client/react';
import { mockInitialState } from '@data-client/test';
import { act, fireEvent, render } from '@testing-library/react';
import React, {
  startTransition,
  Suspense,
  useState,
  useSyncExternalStore,
  useTransition,
  version,
} from 'react';

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Todo extends Entity {
  id = '';
  title = '';
}

const resolvers: Record<
  string,
  (value: { id: string; title: string }) => void
> = {};
const fetchTodo = jest.fn(
  ({ id }: { id: string }) =>
    new Promise<{ id: string; title: string }>(resolve => {
      resolvers[id] = resolve;
    }),
);
const getTodo = new Endpoint(fetchTodo, {
  schema: Todo,
  name: 'getTodo',
  pollFrequency: 60000,
});

const stateA = mockInitialState([
  {
    endpoint: getTodo,
    args: [{ id: 'A' }],
    response: { id: 'A', title: 'todo A' },
  },
]);
const noDevManagers = getDefaultManagers({ devToolsManager: null });

function TodoView({ id }: { id: string }) {
  const todo = useSuspense(getTodo, { id });
  return <div data-testid="todo">{todo.title}</div>;
}

function failCalibration(label: string) {
  throw new Error(`${label} on React ${version}: ${JSON.stringify(commits)}`);
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
    render(<Consumer />);
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
  });

  it('a plain state update outside an event commits at Normal priority', async () => {
    let setX: (n: number) => void = () => {};
    function Sample() {
      const [x, set] = useState(0);
      setX = set;
      return <span>{x}</span>;
    }
    render(<Sample />);
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
  });
});

describeConcurrent('startTransition over useSuspense', () => {
  let consoleRecorder: ReturnType<typeof recordConsoleErrors>;
  let controller: ReturnType<typeof useController>;

  function Probe() {
    controller = useController();
    return null;
  }

  function App() {
    const [id, setId] = useState('A');
    const [isPending, start] = useTransition();
    const [text, setText] = useState('');
    return (
      <div>
        <Probe />
        <span data-testid="pending">{String(isPending)}</span>
        <input
          data-testid="input"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          data-testid="next"
          onClick={() => {
            start(() => setId('B'));
          }}
        >
          next
        </button>
        <Suspense fallback={<p>loading</p>}>
          <TodoView id={id} />
        </Suspense>
      </div>
    );
  }

  beforeAll(() => {
    consoleRecorder = recordConsoleErrors();
  });

  beforeEach(() => {
    consoleRecorder.unexpected.length = 0;
    flushSync.mockClear();
    useSyncExternalStoreMock.mockClear();
    fetchTodo.mockClear();
    for (const key of Object.keys(resolvers)) delete resolvers[key];
  });

  afterEach(() => {
    expect(flushSync).not.toHaveBeenCalled();
    expect(useSyncExternalStoreMock).not.toHaveBeenCalled();
    expect(consoleRecorder.unexpected).toEqual([]);
  });

  afterAll(() => {
    consoleRecorder.restore();
  });

  it('startTransition over useSuspense keeps the committed UI, accepts urgent input, then commits B', async () => {
    const { getByTestId, queryByText } = render(
      <DataProvider
        initialState={stateA}
        devButton={null}
        managers={noDevManagers}
      >
        <App />
      </DataProvider>,
    );
    expect(getByTestId('todo').textContent).toBe('todo A');
    act(() => {
      fireEvent.click(getByTestId('next'));
    });
    expect(queryByText('loading')).toBeNull();
    expect(getByTestId('todo').textContent).toBe('todo A');
    expect(getByTestId('pending').textContent).toBe('true');
    expect(fetchTodo).toHaveBeenCalledTimes(1);
    expect(fetchTodo).toHaveBeenCalledWith({ id: 'B' });

    act(() => {
      fireEvent.change(getByTestId('input'), { target: { value: 'x' } });
    });
    expect((getByTestId('input') as HTMLInputElement).value).toBe('x');
    expect(getByTestId('pending').textContent).toBe('true');
    expect(queryByText('loading')).toBeNull();
    expect(getByTestId('todo').textContent).toBe('todo A');

    resetCommits();
    await act(async () => {
      resolvers.B({ id: 'B', title: 'todo B' });
    });
    expect(getByTestId('todo').textContent).toBe('todo B');
    expect(getByTestId('pending').textContent).toBe('false');
    expectNoImmediateCommit('fetch resolution');
  });

  it('controller.setResponse inside startTransition commits at non-sync priority', () => {
    const stateB = mockInitialState([
      {
        endpoint: getTodo,
        args: [{ id: 'B' }],
        response: { id: 'B', title: 'todo B' },
      },
    ]);
    function ShowB() {
      const todo = useSuspense(getTodo, { id: 'B' });
      return (
        <div>
          <Probe />
          <div data-testid="todo">{todo.title}</div>
        </div>
      );
    }
    const { getByTestId } = render(
      <DataProvider
        initialState={stateB}
        devButton={null}
        managers={noDevManagers}
      >
        <Suspense fallback={<p>loading</p>}>
          <ShowB />
        </Suspense>
      </DataProvider>,
    );
    expect(getByTestId('todo').textContent).toBe('todo B');
    resetCommits();
    act(() => {
      startTransition(() => {
        controller.setResponse(
          getTodo,
          { id: 'B' },
          {
            id: 'B',
            title: 'todo B v2',
          },
        );
      });
    });
    expect(getByTestId('todo').textContent).toBe('todo B v2');
    expectOnlyNormalCommits('transition setResponse');
    expect(commits.every(c => c.priority === NormalPriority)).toBe(true);
  });

  it('a store write outside any event commits at default priority', async () => {
    const { getByTestId } = render(
      <DataProvider
        initialState={stateA}
        devButton={null}
        managers={noDevManagers}
      >
        <App />
      </DataProvider>,
    );
    resetCommits();
    await act(async () => {
      await Promise.resolve();
      controller.setResponse(
        getTodo,
        { id: 'A' },
        {
          id: 'A',
          title: 'todo A v2',
        },
      );
    });
    expect(getByTestId('todo').textContent).toBe('todo A v2');
    expectOnlyNormalCommits('default-lane setResponse');
    expect(commits.every(c => c.priority === NormalPriority)).toBe(true);
  });

  it('useLive / useCache consumers re-render from Context on a transition publish', () => {
    function Consumers() {
      const cached = useCache(getTodo, { id: 'A' });
      const live = useLive(getTodo, { id: 'A' });
      return (
        <div>
          <Probe />
          <span data-testid="cache">{cached?.title}</span>
          <span data-testid="live">{live.title}</span>
        </div>
      );
    }
    const { getByTestId } = render(
      <DataProvider
        initialState={stateA}
        devButton={null}
        managers={noDevManagers}
      >
        <Suspense fallback={<p>loading</p>}>
          <Consumers />
        </Suspense>
      </DataProvider>,
    );
    expect(getByTestId('cache').textContent).toBe('todo A');
    expect(getByTestId('live').textContent).toBe('todo A');
    resetCommits();
    act(() => {
      startTransition(() => {
        controller.setResponse(
          getTodo,
          { id: 'A' },
          {
            id: 'A',
            title: 'todo A v2',
          },
        );
      });
    });
    expect(getByTestId('cache').textContent).toBe('todo A v2');
    expect(getByTestId('live').textContent).toBe('todo A v2');
    expectOnlyNormalCommits('transition publish to useCache/useLive');
  });
});
