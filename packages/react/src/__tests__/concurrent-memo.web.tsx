import { Endpoint, Entity } from '@data-client/endpoint';
import {
  DataProvider,
  getDefaultManagers,
  useController,
  useSuspense,
} from '@data-client/react';
import { mockInitialState } from '@data-client/test';
import { act, fireEvent, render } from '@testing-library/react';
import { Todo, type TodoItem } from '__tests__/concurrentFixtures';
import React, { Suspense, useState, useTransition, version } from 'react';

import useCacheState from '../hooks/useCacheState';

const LegacyReact = version.startsWith('16') || version.startsWith('17');
const describeConcurrent = LegacyReact ? describe.skip : describe;

class Note extends Entity {
  id = '';
  text = '';
}

const ROWS = 300;
const rows = (): TodoItem[] =>
  Array.from({ length: ROWS }, (_, i) => ({ id: `${i}`, title: `${i}` }));

const getTodoList = new Endpoint(() => Promise.resolve(rows()), {
  schema: [Todo],
  name: 'getTodoList',
});
const getTodo = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, title: id }),
  { schema: Todo, name: 'getTodo' },
);
const getNote = new Endpoint(
  ({ id }: { id: string }) => Promise.resolve({ id, text: id }),
  { schema: Note, name: 'getNote' },
);
const resolvers: Record<string, (value: TodoItem) => void> = {};
const getDetail = new Endpoint(
  ({ id }: { id: string }) =>
    new Promise<TodoItem>(resolve => {
      resolvers[id] = resolve;
    }),
  { schema: Todo, name: 'getDetail' },
);
const noDevManagers = getDefaultManagers({ devToolsManager: null });

/** Stable small ids for objects, so a render can name the entity versions it read. */
const ids = new WeakMap<object, number>();
let nextId = 0;
const idOf = (o: object | undefined) => {
  if (!o) return -1;
  let id = ids.get(o);
  if (id === undefined) {
    id = nextId++;
    ids.set(o, id);
  }
  return id;
};

/**
 * Every render of the list: which entity versions it read, and the result it
 * got back. A render that reads versions an earlier render already read, but
 * gets a different result, is a miss that caching more would have avoided.
 */
type ListRender = { versions: string; data: unknown };
let renders: ListRender[] = [];

function List() {
  const todos = useSuspense(getTodoList);
  const state = useCacheState();
  const table = (state.entities[Todo.key] ?? {}) as Record<string, object>;
  renders.push({
    versions: todos.map(todo => idOf(table[todo.id])).join(','),
    data: todos,
  });
  return <div data-testid="count">{todos.length}</div>;
}

function Detail({ id }: { id: string }) {
  const todo = useSuspense(getDetail, { id });
  return <div data-testid="detail">{todo.title}</div>;
}

let controller: ReturnType<typeof useController>;
function App() {
  controller = useController();
  const [detail, setDetail] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isPending, start] = useTransition();
  return (
    <div>
      <span data-testid="pending">{String(isPending)}</span>
      <input
        data-testid="input"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        data-testid="open"
        onClick={() =>
          start(() => {
            // Edits a listed row, then suspends on the detail, so the
            // transition stays pending while urgent updates commit.
            controller.setResponse(getTodo, { id: '5' }, {
              id: '5',
              title: 'from transition',
            });
            setDetail('X');
          })
        }
      >
        open
      </button>
      <Suspense fallback={<p>loading list</p>}>
        <List />
      </Suspense>
      {/* already revealed, so a transition that suspends here stays pending */}
      <Suspense fallback={<p>loading detail</p>}>
        {detail ? <Detail id={detail} /> : null}
      </Suspense>
    </div>
  );
}

function avoidableMisses(list: ListRender[]) {
  const seen = new Map<string, unknown>();
  let misses = 0;
  for (const { versions, data } of list) {
    if (seen.has(versions) && seen.get(versions) !== data) misses++;
    seen.set(versions, data);
  }
  return misses;
}

/** How often a render read versions it had read before, after reading others. */
function flipBacks(list: ListRender[]) {
  const seen = new Set<string>();
  let last: string | undefined;
  let flips = 0;
  for (const { versions } of list) {
    if (versions !== last && seen.has(versions)) flips++;
    seen.add(versions);
    last = versions;
  }
  return flips;
}

function trace(name: string) {
  if (!process.env.MEMO_TRACE) return;
  const label = new Map<string, number>();
  const seq = renders.map(r => {
    if (!label.has(r.versions)) label.set(r.versions, label.size);
    return `v${label.get(r.versions)}:d${idOf(r.data as object)}`;
  });
  console.log(
    `${name}: ${renders.length} renders, ${label.size} versions, ${flipBacks(renders)} flip-backs, ${avoidableMisses(renders)} avoidable misses\n${seq.join(' ')}`,
  );
}

/** Mount, start a transition that stays pending, run `urgent` five times, then let it commit. */
async function runPendingTransition(urgent: (i: number) => void) {
  const { getByTestId } = render(
    <DataProvider
      initialState={mockInitialState([
        { endpoint: getTodoList, args: [], response: rows() },
      ])}
      devButton={null}
      managers={noDevManagers}
    >
      <App />
    </DataProvider>,
  );
  expect(getByTestId('count').textContent).toBe(`${ROWS}`);
  act(() => {
    fireEvent.click(getByTestId('open'));
  });
  expect(getByTestId('pending').textContent).toBe('true');
  for (let i = 0; i < 5; i++) {
    act(() => urgent(i));
    expect(getByTestId('pending').textContent).toBe('true');
  }
  await act(async () => {
    resolvers.X({ id: 'X', title: 'detail' });
  });
  expect(getByTestId('detail').textContent).toBe('detail');
  expect(getByTestId('pending').textContent).toBe('false');
}

describeConcurrent('memoization under concurrent rendering', () => {
  beforeEach(() => {
    renders = [];
    for (const key of Object.keys(resolvers)) delete resolvers[key];
  });

  // While a transition is pending, React renders the urgent lane without its
  // update and retries the transition with it, so the list alternates between
  // the committed rows and the transition's rows.

  it('urgent re-renders during a pending transition reuse the committed result', async () => {
    await runPendingTransition(i => {
      fireEvent.change(document.querySelector('input')!, {
        target: { value: `typed ${i}` },
      });
    });
    trace('typing');
    expect(flipBacks(renders)).toBeGreaterThan(0);
    expect(avoidableMisses(renders)).toBe(0);
  });

  it('urgent writes to other entities during a pending transition reuse the committed result', async () => {
    await runPendingTransition(i => {
      controller.setResponse(getNote, { id: `${i}` }, {
        id: `${i}`,
        text: `note ${i}`,
      });
    });
    trace('other entity writes');
    expect(flipBacks(renders)).toBeGreaterThan(0);
    expect(avoidableMisses(renders)).toBe(0);
  });

  it('urgent writes to a listed row during a pending transition', async () => {
    // React reapplies every update queued after the transition's on each
    // render, so each render reads new rows and none can hit.
    await runPendingTransition(i => {
      controller.setResponse(getTodo, { id: '7' }, {
        id: '7',
        title: `urgent ${i}`,
      });
    });
    trace('listed row writes');
    expect(avoidableMisses(renders)).toBe(0);
  });
});
